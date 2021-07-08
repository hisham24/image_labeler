use actix_files::NamedFile;
use actix_web::{web, HttpResponse, error, Error};
use crate::data::Metadata;
use crate::data::ImageLabels;
use sqlx::PgPool;
use std::fs::File;
use chrono::Utc;
use uuid::Uuid;

pub async fn get_image(
    image: web::Path<String>,
    web::Query(metadata): web::Query<Metadata>,
    pool: web::Data<PgPool>,
) -> Result<NamedFile, Error> {
    let image= image.into_inner();
    let query_result = sqlx::query!(
        r#"
        SELECT COUNT(*)
        FROM images
        WHERE username=$1 AND image_folder=$2 AND image=$3
        "#,
        metadata.username, metadata.image_folder, image
    )
        .fetch_one(pool.get_ref())
        .await
        .map_err(|e| {
            println!("Failed to execute query: {}", e);
            error::ErrorInternalServerError(String::from(""))
        })?;
    let count = match query_result.count {
        Some(num) => num,
        _ => 0,
    };

    if count > 0 {
        Ok(NamedFile::from_file(
            File::open(
            format!("data/{}/{}/{}", metadata.username, metadata.image_folder, image)
            )?,
            image)?
        )
    } else {
    return Err(
            error::ErrorBadRequest(
                String::from("Image has not been uploaded")
            )
        )
    }
}

pub async fn get_bbox(
    image: web::Path<String>,
    web::Query(metadata): web::Query<Metadata>,
    pool: web::Data<PgPool>,
) -> Result<HttpResponse, Error> {
    let image= image.into_inner();
    let image_found = image_exists(&metadata, &image[..], pool.get_ref()).await?;
    if image_found {
        let bboxes = sqlx::query!(
            r#"
            SELECT bbox
            FROM image_labels
            WHERE username=$1 AND image_folder=$2 AND image=$3
            "#,
            metadata.username, metadata.image_folder, image
        )
            .fetch_all(pool.get_ref())
            .await
            .map(|v| -> Vec<(u32, u32, u32, u32)> {
                v.iter().map(|x| -> (u32, u32, u32, u32) {
                    let mut split = x.bbox.split(", ");
                    (split.next().unwrap().parse().unwrap(),
                     split.next().unwrap().parse().unwrap(),
                     split.next().unwrap().parse().unwrap(),
                     split.next().unwrap().parse().unwrap())
                }).collect()
            })
            .map_err(|e| {
                println!("Failed to execute query: {}", e);
                error::ErrorInternalServerError(String::from(""))
            })?;
        println!("{:?}", bboxes);
        Ok(HttpResponse::Ok().json(ImageLabels {
            image_id: image,
            bboxes,
        }))
    } else {
        Err(
            error::ErrorBadRequest(String::from("Image has not been uploaded previously."))
        )
    }
}

pub async fn update_bbox(
    image_labels: web::Json<ImageLabels>,
    image: web::Path<String>,
    web::Query(metadata): web::Query<Metadata>,
    pool: web::Data<PgPool>,
) -> Result<HttpResponse, Error> {
    println!("Received update_bbox request");
    let image = image.into_inner();
    let image_found = image_exists(&metadata, &image[..], pool.get_ref()).await?;
    if image_found {
        sqlx::query!(
                r#"
                DELETE FROM image_labels
                WHERE username=$1 AND image_folder=$2 AND image=$3
                "#,
                metadata.username,
                metadata.image_folder,
                image
            )
            .execute(pool.get_ref())
            .await
            .map_err(|e| {
                println!("Failed to execute query: {}", e);
                error::ErrorInternalServerError(String::from(""))
            })?;
        println!("Received bboxes: {:?}", image_labels.bboxes);
        for bbox in image_labels.bboxes.iter() {
            sqlx::query!(
                r#"
                INSERT INTO image_labels (id, username, image_folder, image, bbox, upload_at)
                VALUES ($1, $2, $3, $4, $5, $6)
                "#,
                Uuid::new_v4(),
                metadata.username,
                metadata.image_folder,
                image,
                format!("{}, {}, {}, {}", bbox.0, bbox.1, bbox.2, bbox.3),
                Utc::now()
            )
                .execute(pool.get_ref())
                .await
                .map_err(|e| {
                    println!("Failed to execute query: {}", e);
                    error::ErrorInternalServerError(String::from(""))
                })?;
        }
        Ok(HttpResponse::Ok().finish())
    } else {
        Err(
            error::ErrorBadRequest(String::from("Image has not been uploaded previously."))
        )
    }
}

async fn image_exists(metadata: &Metadata, image: &str, pool: &PgPool) -> Result<bool, Error> {
    let query_result = sqlx::query!(
        r#"
        SELECT COUNT(*)
        FROM images
        WHERE username=$1 AND image_folder=$2 AND image=$3
        "#,
        metadata.username, metadata.image_folder, image
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
    println!("image_exists: received count {:?}", count);
    return Ok(count > 0);
}
