use actix_web::{HttpResponse, web, error, Error};
use sqlx::PgPool;
use crate::data::{Metadata, SavedImages};
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
    println!("Saved images are {:?} with count {}", images, count);
    Ok(HttpResponse::Ok().json(SavedImages {
        images,
        count,
    }))
}