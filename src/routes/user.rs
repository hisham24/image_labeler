use bcrypt::{DEFAULT_COST, hash, verify};
use actix_web::{web, HttpResponse, error, Error};
use crate::data::UserRequest;
use crate::auth;
use sqlx::PgPool;
use chrono::Utc;
use uuid::Uuid;
use std::collections::HashMap;

pub async fn sign_up(
    metadata: web::Json<UserRequest>,
    pool: web::Data<PgPool>,
) -> Result<HttpResponse, Error> {
    if user_exists(&metadata.username[..], pool.get_ref()).await? {
        return Err(error::ErrorConflict(String::from("Username has been taken")));
    }
    let hashed_password = hash(metadata.password.as_str(), DEFAULT_COST)
        .map_err(|e| {
            println!("Failed to hash password with error: {}", e);
            error::ErrorInternalServerError(String::from(""))
        })?;

    sqlx::query!(
        r#"
        INSERT INTO users (id, username, password, created_at)
        VALUES ($1, $2, $3, $4)
        "#,
        Uuid::new_v4(),
        metadata.username,
        hashed_password,
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

pub async fn login(
    metadata: web::Json<UserRequest>,
    pool: web::Data<PgPool>,
) -> Result<HttpResponse, Error> {
    if !user_exists(&metadata.username[..], pool.get_ref()).await? {
        return Err(error::ErrorUnauthorized(String::from("Invalid username")));
    }

    let query_result = sqlx::query!(
        r#"
        SELECT id, password
        FROM users
        WHERE username=$1
        "#,
        metadata.username,
    )
        .fetch_one(pool.get_ref())
        .await
        .map_err(|e| {
            println!("Failed to execute query: {}", e);
            error::ErrorInternalServerError(String::from(""))
        })?;

    let valid = verify(metadata.password.as_str(), query_result.password.as_str())
        .map_err(|e| {
            println!("Error verifying password: {}", e);
            error::ErrorInternalServerError(String::from(""))
        })?;
    if valid {
        let token = auth::create_jwt(
            query_result.id.to_string(),
            metadata.username.clone()
        ).map_err(|e| {
            println!("Error creating jwt token: {}", e);
            error::ErrorInternalServerError(String::from(""))
        })?;
        let mut response = HashMap::new();
        response.insert("token", token);
        Ok(HttpResponse::Ok().json(response))
    } else {
        Err(error::ErrorUnauthorized(String::from("Invalid username or password")))
    }
}

async fn user_exists(
    username: &str,
    pool: &PgPool
) -> Result<bool, Error> {
    let query_result = sqlx::query!(
        r#"
        SELECT COUNT(*)
        FROM users
        WHERE username=$1
        "#,
        username
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
    return Ok(count > 0);
}