use actix_web::{HttpResponse, web, error, Error};
use sqlx::PgPool;
use crate::data::Metadata;


pub async fn get_images_information(
    info: web::Json<Metadata>,
    pool: web::Data<PgPool>
) -> Result<HttpResponse, Error> {
    let query_result = sqlx::query!(
        r#"
        SELECT COUNT(*)
        FROM images
        WHERE username=$1 AND image_folder=$2
        "#,
        info.username,
        info.image_folder
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
    println!("Received count {:?}", count);
    let mut response = std::collections::HashMap::new();
    response.insert("count", count);
    Ok(HttpResponse::Ok().json(response))
}