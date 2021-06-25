use crate::routes;
use actix_web::dev::Server;
use std::net::TcpListener;
use actix_web::{HttpServer, App, web};
use sqlx::PgPool;

pub fn run(
    listener: TcpListener,
    db_pool: PgPool) -> Result<Server, std::io::Error> {
    let db_pool = web::Data::new(db_pool);

    // Start http server
    let server = HttpServer::new(move || {
        App::new()
            .app_data(db_pool.clone())
            .route("/health_check", web::get().to(routes::health_check))
            .route("/images", web::get().to(routes::get_images_information))
            .route("/images", web::post().to(routes::upload_images))
            .route("/image", web::post().to(routes::upload_image))
            .route("/images/{id}", web::get().to(routes::get_image))
            .route("/images/bbox/{id}", web::get().to(routes::get_bbox))
            .route("/images/bbox/{id}", web::post().to(routes::update_bbox))
    })
        .listen(listener)?
        .run();
    Ok(server)
}