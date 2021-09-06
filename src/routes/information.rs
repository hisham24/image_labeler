use actix_web::{HttpResponse, web, error, Error};
use sqlx::PgPool;
use crate::data::{Metadata, SavedImages, UserInfo};
use std::collections::HashMap;

pub async fn get_images_information(
    web::Query(metadata): web::Query<Metadata>,
    pool: web::Data<PgPool>
) -> Result<HttpResponse, Error> {
    let images = sqlx::query!(
        r#"
        SELECT image
        FROM images
        WHERE username=$1 AND image_folder=$2
        "#,
        metadata.username,
        metadata.image_folder
    )
        .fetch_all(pool.get_ref())
        .await
        .map(|v| -> Vec<String> {
            v.iter().map(|x| -> String {
                x.image.clone()
            }).collect()
        })
        .map_err(|e| {
            println!("Failed to execute query: {}", e);
            error::ErrorInternalServerError(String::from(""))
        })?;
    let count = images.len();
    Ok(HttpResponse::Ok().json(SavedImages {
        images,
        count,
    }))
}

pub async fn get_image_folders(
    web::Query(user_info): web::Query<UserInfo>,
    pool: web::Data<PgPool>
) -> Result<HttpResponse, Error> {
    let image_folders = sqlx::query!(
        r#"
        SELECT image_folder
        FROM images_metadata
        WHERE username=$1
        "#,
        user_info.username
    )
        .fetch_all(pool.get_ref())
        .await
        .map(|v| -> Vec<String> {
            v.iter().map(|x| -> String {
                x.image_folder.clone()
            }).collect()
        })
        .map_err(|e| {
            println!("Failed to execute query: {}", e);
            error::ErrorInternalServerError(String::from(""))
        })?;

    let mut response = HashMap::new();
    response.insert("image_folders", image_folders);
    Ok(HttpResponse::Ok().json(
        response
    ))
}