use actix_web::{web, error, Error, HttpResponse};
use sqlx::PgPool;
use chrono::Utc;
use uuid::Uuid;
use std::io::Write;
use actix_multipart::Multipart;
use futures::{TryStreamExt, StreamExt};
use std::path::Path;
use crate::data::Metadata;

pub async fn upload_images(
    metadata: web::Json<Metadata>,
    pool: web::Data<PgPool>,
) -> Result<HttpResponse, Error> {
    sqlx::query!(
        r#"
        INSERT INTO images_metadata (id, username, image_folder, upload_at)
        VALUES ($1, $2, $3, $4)
        "#,
        Uuid::new_v4(),
        metadata.username,
        metadata.image_folder,
        Utc::now()
    )
        .execute(pool.get_ref())
        .await
        .map_err(|e| {
            println!("Failed to execute query: {}", e);
            error::ErrorInternalServerError(String::from(""))
        })?;
    std::fs::create_dir_all(format!("./data/{}/{}/", metadata.username, metadata.image_folder))?;
    Ok(HttpResponse::Ok().finish())
}

pub async fn upload_image(
    mut payload: Multipart,
    pool: web::Data<PgPool>
) -> Result<HttpResponse, Error> {
    println!("IN UPLOAD IMAGE CALL");
    let mut value = None;
    // let mut finished_uploading = false; // Need to implement logic for extra safety, no need
                                             // for now
    let mut filename = None;
    let mut metadata_found = false;
    // iterate over multipart stream
    while let Ok(Some(mut field)) = payload.try_next().await {
        let content_type = field.content_type();
        println!("Content type: {}", content_type);

        // Parse JSON
        if content_type.to_string() == "application/json" {
            // Maybe implement max payload size (https://actix.rs/docs/request/)
            let mut body = web::BytesMut::new();
            while let Some(chunk) = field.next().await {
                let data = chunk.unwrap();
                body.extend_from_slice(&data);
            }

            // Convert stream of bytes into String
            let x = String::from_utf8_lossy(&body[..]).into_owned();
            // TODO: Do error handling. Client error
            println!("Received data {}", x);
            value = Some(serde_json::from_str::<Metadata>(&*x).unwrap());
            let metadata = match value {
                Some(ref value) => {
                    println!("value: {:?}", value);
                    value
                }
                _ => return Err(
                    error::ErrorBadRequest(String::from("Failed to read metadata in request."))
                ),
            };
            println!("Metadata is {:?}", metadata);
            metadata_found = metadata_exists(metadata, pool.get_ref()).await?;
        } else {
            // Save file
            if !metadata_found {
                return Err(
                    error::ErrorBadRequest(
                        String::from("Metadata information should be uploaded first")
                    )
                )
            }

            let content_disposition = field.content_disposition().unwrap();
            // TODO: Return error if filename not present
            filename = Some(String::from(content_disposition.get_filename().unwrap()));
            println!("content_disposition: {}", content_disposition);
            let value = match value {
                Some(ref value) => value,
                None => return Err(
                    error::ErrorInternalServerError(
                        String::from("Metadata information should be attached first")
                    )
                ),
            };
            std::fs::create_dir_all(format!("./data/{}/{}/", &*value.username, &*value.image_folder))?;
            if !Path::new(&*format!("./data/{}/{}/", &*value.username, &*value.image_folder)).exists() {
                return Err(
                    error::ErrorInternalServerError(String::from("User and image folder was not registered beforehand."))
                )
            }
            let filepath = format!("./data/{}/{}/{}", &*value.username, &*value.image_folder,
                                    sanitize_filename::sanitize(filename.as_ref().unwrap()));

            let mut f = web::block(|| std::fs::File::create(filepath))
                .await
                .unwrap()
                .unwrap();

            // Field in turn is stream of *Bytes* object
            while let Some(chunk) = field.next().await {
                let data = chunk.unwrap();
                // filesystem operations are blocking, we have to use threadpool
                f = web::block(move || f.write_all(&data).map(|_| f))
                    .await?
                    .unwrap();
            }
            // finished_uploading = true;
        }
    }

    let filename = match filename {
        Some(ref filename_string) => filename_string,
        None => return Err(error::ErrorInternalServerError(String::from("Failed to allocate file"))),
    };

    let value = match value {
        Some(value) => value,
        None => return Err(error::ErrorBadRequest(String::from("Metadata not received"))),
    };
    sqlx::query!(
        r#"
        INSERT INTO images (id, username, image_folder, image, upload_at)
        VALUES ($1, $2, $3, $4, $5)
        "#,
        Uuid::new_v4(),
        value.username,
        value.image_folder,
        filename,
        Utc::now()
    )
        .execute(pool.get_ref())
        .await
        .map_err(|e| {
            println!("Failed to execute query: {}", e);
            error::ErrorInternalServerError(String::from(""))
        })?;
    Ok(HttpResponse::Ok().finish())
}

async fn metadata_exists(metadata: &Metadata, pool: &PgPool) -> Result<bool, Error> {
    let query_result = sqlx::query!(
        r#"
        SELECT COUNT(*)
        FROM images_metadata
        WHERE username=$1 AND image_folder=$2
        "#,
        metadata.username, metadata.image_folder
    )
        .fetch_one(pool)
        .await
        .map_err(|e| {
            println!("Failed to execute query: {}", e);
            error::ErrorInternalServerError(String::from(""))
        })?;

    let count = match query_result.count {
        Some(num) => num,
        _ => 0,
    };
    println!("metadata_exists: received count {:?}", count);
    return Ok(count > 0)
}