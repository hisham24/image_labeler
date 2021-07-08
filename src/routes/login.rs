pub async fn login(
    metadata: web::Json<LoginRequest>
) -> Result<HttpResponse, Error> {
    Ok(HttpResponse::Ok().finish())
}