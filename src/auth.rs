use jsonwebtoken::{decode, encode, Algorithm,
                   DecodingKey, EncodingKey,
                   Header, Validation};
use chrono;
use actix_web::{Error, error};
use actix_web::dev::ServiceRequest;
use actix_web_httpauth::extractors::bearer::{BearerAuth, Config};
use actix_web_httpauth::extractors::AuthenticationError;

const JWT_SECRET: &[u8] = b"secret";
const PUBLIC_ROUTES: [&str; 3] = ["/health_check", "/signup", "/login"];

#[derive(Debug, serde::Serialize, serde::Deserialize)]
struct Claims {
    sub: String,
    username: String,
    exp: i64,
}
pub fn create_jwt(id: String, username: String) -> Result<String, Error> {
    let expiration = chrono::Utc::now()
        .checked_add_signed(chrono::Duration::seconds(3600))
        .expect("Invalid timestamp")
        .timestamp();

    let claims = Claims {
        sub: id,
        username,
        exp: expiration,
    };

    let header = Header::new(Algorithm::HS256);
    encode(&header, &claims, &EncodingKey::from_secret(JWT_SECRET))
        .map_err(|e| {
            println!("Error generating token: {}", e);
            error::ErrorInternalServerError(String::from(""))
        })
}

pub async fn validator(req: ServiceRequest, credentials: BearerAuth) -> Result<ServiceRequest, Error> {
    for route in PUBLIC_ROUTES.iter() {
        if req.path().starts_with(route) {
            return Ok(req);
        }
    }

    if let Ok(_) = decode::<Claims>(
        credentials.token(),
        &DecodingKey::from_secret(JWT_SECRET),
        &Validation::new(Algorithm::HS256)
    ) {
        return Ok(req);
    }

    let config = req
        .app_data::<Config>()
        .map(|data| data.clone())
        .unwrap_or_else(Default::default);

    Err(AuthenticationError::from(config).into())
}