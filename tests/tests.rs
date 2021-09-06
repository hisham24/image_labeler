use std::net::TcpListener;
use std::collections::HashMap;
use sqlx::{PgConnection, Connection, PgPool, Executor};
use image_labeler::startup::run;
use image_labeler::configuration::{get_configuration, DatabaseSettings};
use uuid::Uuid;
use image_labeler::data::{Metadata, ImageLabels, SavedImages, UserRequest};
use std::fs::remove_dir_all;
use std::path::Path;
use reqwest::{blocking, Client};
use tokio::task;
use std::fs;
use tempfile::Builder;
use bcrypt::{hash, DEFAULT_COST};

pub struct TestApp {
    pub address: String,
    pub db_pool: PgPool,
}

#[derive(serde::Deserialize)]
struct Token {
    username: String,
    token: String,
}

async fn spawn_app() -> TestApp {
    let listener = TcpListener::bind("127.0.0.1:0").expect("Failed to bind random port");
    let port = listener.local_addr().unwrap().port();
    let address = format!("http://127.0.0.1:{}", port);

    let mut configuration = get_configuration().expect("Failed to read configuration.");
    configuration.database.database_name = Uuid::new_v4().to_string();
    println!("Database is {}", configuration.database.database_name);

    let connection_pool = configure_database(&configuration.database).await;

    let server = run(listener, connection_pool.clone()).expect("Failed to bind address");
    let _ = tokio::spawn(server);

    TestApp {
        address,
        db_pool: connection_pool,
    }
}

async fn configure_database(config: &DatabaseSettings) -> PgPool {
    let mut connection = PgConnection::connect(&config.connection_string_without_db())
        .await
        .expect("Failed to connect to Postgres.");
    connection
        .execute(&*format!(r#"CREATE DATABASE "{}";"#, config.database_name))
        .await
        .expect("Failed to create database");

    let connection_pool = PgPool::connect(&config.connection_string())
        .await
        .expect("Failed to connect to Postgres.");
    sqlx::migrate!("./migrations")
        .run(&connection_pool)
        .await
        .expect("Failed to migrate the database");

    connection_pool
}

async fn get_authorization_token(client: &Client, app: &TestApp) -> String {
    let user_request = UserRequest {
        username: String::from("testUser"),
        password: String::from("testPassword24"),
    };

    let response = client
        .post(format!("{}/signup", app.address))
        .json(&user_request)
        .send()
        .await
        .expect("Failed to execute request.");

    assert_eq!(200, response.status().as_u16());

    let response = client
        .post(format!("{}/login", app.address))
        .json(&user_request)
        .send()
        .await
        .expect("Failed to execute request.");

    assert_eq!(200, response.status().as_u16());
    let token_response: Token = response
        .json()
        .await
        .expect("Failed to receive token in response");

    token_response.token
}

#[actix_rt::test]
async fn health_check_works() {
    let app = spawn_app().await;

    let client = reqwest::Client::new();

    let response = client
        .get(format!("{}/health_check", app.address))
        .send()
        .await
        .expect("Failed to execute request.");

    assert!(response.status().is_success());
    assert_eq!(Some(0), response.content_length());
}

#[actix_rt::test]
async fn signup_returns_a_200_for_valid_data() {
    let app = spawn_app().await;
    let client = reqwest::Client::new();

    let user_request = UserRequest {
        username: String::from("testUser"),
        password: String::from("testPassword24"),
    };

    let response = client
        .post(format!("{}/signup", app.address))
        .json(&user_request)
        .send()
        .await
        .expect("Failed to execute request.");

    assert_eq!(200, response.status().as_u16());

    let query_result = sqlx::query!(
        r#"
        SELECT COUNT(*)
        FROM users
        WHERE username=$1
        "#,
        user_request.username
    )
        .fetch_one(&app.db_pool)
        .await
        .expect("Failed to fetch created user");
    let count = match query_result.count {
        Some(num) => num,
        _ => 0,
    };

    assert_eq!(1, count);
}

#[actix_rt::test]
async fn login_returns_a_200_for_authorized_request() {
    let app = spawn_app().await;
    let client = reqwest::Client::new();

    let user_request = UserRequest {
        username: String::from("testUser"),
        password: String::from("testPassword24"),
    };

    let response = client
        .post(format!("{}/signup", app.address))
        .json(&user_request)
        .send()
        .await
        .expect("Failed to execute request.");

    assert_eq!(200, response.status().as_u16());

    let response = client
        .post(format!("{}/login", app.address))
        .json(&user_request)
        .send()
        .await
        .expect("Failed to execute request.");

    assert_eq!(200, response.status().as_u16());
    let token_response: Token = response
        .json()
        .await
        .expect("Failed to receive token in response");
    assert!(token_response.token.len() > 0);
}

#[actix_rt::test]
async fn login_returns_a_401_for_unauthorized_request() {
    let app = spawn_app().await;
    let client = reqwest::Client::new();

    let user_request = UserRequest {
        username: String::from("testUser"),
        password: String::from("testPassword24"),
    };

    let response = client
        .post(format!("{}/login", app.address))
        .json(&user_request)
        .send()
        .await
        .expect("Failed to execute request.");

    assert_eq!(401, response.status().as_u16());
}

// upload_images
#[actix_rt::test]
async fn upload_images_returns_a_200_for_valid_data() {
    let app = spawn_app().await;
    let client = reqwest::Client::new();

    let token = get_authorization_token(&client, &app).await;

    let metadata = Metadata {
        username: String::from("mock_username_upload_images_200"),
        image_folder: String::from("mock_image_folder"),
    };

    let response = client
        .post(format!("{}/api/images", app.address))
        .bearer_auth(token.as_str())
        .json(&metadata)
        .send()
        .await
        .expect("Failed to execute request.");

    assert_eq!(200, response.status().as_u16());

    let query_result = sqlx::query!(
        r#"
        SELECT COUNT(*)
        FROM images_metadata
        WHERE username=$1 AND image_folder=$2
        "#,
        metadata.username, metadata.image_folder
    )
        .fetch_one(&app.db_pool)
        .await
        .expect("Failed to fetch saved images");
    let count = match query_result.count {
        Some(num) => num,
        _ => 0,
    };
    assert_eq!(count, 1);
    remove_dir_all(format!("./data/{}", metadata.username))
        .expect("Failed to delete folder");
}

#[actix_rt::test]
async fn upload_images_returns_a_400_when_data_is_missing() {
    let app = spawn_app().await;
    let client = reqwest::Client::new();

    let token = get_authorization_token(&client, &app).await;

    let mut test_case0 = HashMap::new();
    test_case0.insert("username", "mock_username_upload_images_400");

    let mut test_case1 = HashMap::new();
    test_case1.insert("image_folder", "mock_image_folder");
    let test_cases = vec![
        (test_case0, "missing image_folder"),
        (test_case1, "missing username"),
    ];

    for (invalid_body, error_message) in test_cases {
        let response = client
            .post(format!("{}/api/images", app.address))
            .bearer_auth(token.as_str())
            .json(&invalid_body)
            .send()
            .await
            .expect("Failed to execute request");

        assert_eq!(
            400,
            response.status().as_u16(),
            "The API did not fail with 400 Bad Request when the payload was {}.",
            error_message
        );
    }
}

// upload_image
#[actix_rt::test]
async fn upload_image_returns_a_200_for_valid_data() {
    let app = spawn_app().await;
    let client = reqwest::Client::new();

    let token = get_authorization_token(&client, &app).await;

    let metadata = Metadata {
        username: String::from("mock_username_upload_image_200"),
        image_folder: String::from("mock_image_folder"),
    };

    let response = client
        .post(format!("{}/api/images", app.address))
        .bearer_auth(token.as_str())
        .json(&metadata)
        .send()
        .await
        .expect("Failed to execute request.");
    // Check if metadata upload was success before proceeding
    assert_eq!(200, response.status().as_u16());

    let address = app.address.clone();
    let token_copy = token.clone();
    let response = task::spawn_blocking(move || {
        let metadata_part = blocking::multipart::Part::text(
            "{\"username\": \"mock_username_upload_image_200\", \"image_folder\": \"mock_image_folder\"}"
        )
            .mime_str("application/json")
            .expect("Failed to set content-type");
        let file_part = blocking::multipart::Part::file(
            "static/test_images/im1.png"
        )
            .expect("Failed to attach image to multipart")
            .mime_str("image/png")
            .expect("Failed to set content-type");
        let form = blocking::multipart::Form::new()
            .part("metadata", metadata_part)
            .part("attached_image", file_part);

        let client = blocking::Client::new();
        client
            .post(format!("{}/api/image", address))
            .bearer_auth(token_copy.as_str())
            .multipart(form)
            .send()
            .expect("Failed to execute request.")
    })
        .await
        .expect("Failed multipart request");

    assert_eq!(200, response.status().as_u16());
    assert!(Path::new(
        &*format!("./data/{}/{}/im1.png", metadata.username, metadata.image_folder)
    ).exists());
    let query_result = sqlx::query!(
        r#"
        SELECT COUNT(*)
        FROM images
        WHERE username=$1 AND image_folder=$2 AND image=$3
        "#,
        metadata.username, metadata.image_folder, "im1.png"
    )
        .fetch_one(&app.db_pool)
        .await
        .expect("Failed to fetch saved images");
    let count = match query_result.count {
        Some(num) => num,
        _ => 0,
    };
    assert_eq!(count, 1);
    remove_dir_all(format!("./data/{}", metadata.username))
        .expect("Failed to delete folder");
}

#[actix_rt::test]
async fn upload_image_returns_a_400_metadata_is_missing() {
    let app = spawn_app().await;
    let client = reqwest::Client::new();

    let token = get_authorization_token(&client, &app).await;

    let metadata = Metadata {
        username: String::from("mock_username_upload_image_400"),
        image_folder: String::from("mock_image_folder"),
    };

    let address = app.address.clone();
    let token_copy = token.clone();
    let response = task::spawn_blocking(move || {
        let metadata_part = blocking::multipart::Part::text(
            "{\"username\": \"mock_username_upload_image_400\", \"image_folder\": \"mock_image_folder\"}"
        )
            .mime_str("application/json")
            .expect("Failed to set content-type");
        let file_part = blocking::multipart::Part::file(
            "static/test_images/im1.png"
        )
            .expect("Failed to attach image to multipart")
            .mime_str("image/png")
            .expect("Failed to set content-type");
        let form = blocking::multipart::Form::new()
            .part("metadata", metadata_part)
            .part("attached_image", file_part);

        let client = blocking::Client::new();
        client
            .post(format!("{}/api/image", address))
            .bearer_auth(token_copy.as_str())
            .multipart(form)
            .send()
            .expect("Failed to execute request.")
    })
        .await
        .expect("Failed to multipart request");

    assert_eq!(400, response.status().as_u16());
    assert!(!Path::new(
        &*format!("./data/{}/{}/im1.png", metadata.username, metadata.image_folder)
    ).exists());
    let query_result = sqlx::query!(
        r#"
        SELECT COUNT(*)
        FROM images
        WHERE username=$1 AND image_folder=$2 AND image=$3
        "#,
        "mock_username", "mock_image_folder", "im1.png"
    )
        .fetch_one(&app.db_pool)
        .await
        .expect("Failed to fetch saved images");
    let count = match query_result.count {
        Some(num) => num,
        _ => 0,
    };
    assert_eq!(count, 0);
}

#[actix_rt::test]
async fn get_images_information_returns_correct_count() {
    let app = spawn_app().await;
    let client = reqwest::Client::new();

    let token = get_authorization_token(&client, &app).await;

    let metadata = Metadata {
        username: String::from("mock_username_get_images_information"),
        image_folder: String::from("mock_image_folder"),
    };

    let response = client
        .post(format!("{}/api/images", app.address))
        .bearer_auth(token.as_str())
        .json(&metadata)
        .send()
        .await
        .expect("Failed to execute request.");

    // Check if metadata upload was success before proceeding
    assert_eq!(200, response.status().as_u16());

    let response = client
        .get(
            format!(
                "{}/api/images?username={}&image_folder={}",
                app.address, metadata.username, metadata.image_folder
            ))
        .bearer_auth(token.as_str())
        .json(&metadata)
        .send()
        .await
        .expect("Failed to execute request.");

    assert_eq!(200, response.status().as_u16());

    let images_saved = response.json::<SavedImages>()
        .await
        .expect("Failed to deserialize response");
    assert_eq!(0, images_saved.count);

    let address = app.address.clone();
    let token_copy = token.clone();
    let response = task::spawn_blocking(move || {
        let metadata_part = blocking::multipart::Part::text(
            "{\"username\": \"mock_username_get_images_information\", \"image_folder\": \"mock_image_folder\"}"
        )
            .mime_str("application/json")
            .expect("Failed to set content-type");
        let file_part = blocking::multipart::Part::file(
            "static/test_images/im1.png"
        )
            .expect("Failed to attach image to multipart")
            .mime_str("image/png")
            .expect("Failed to set content-type");
        let form = blocking::multipart::Form::new()
            .part("metadata", metadata_part)
            .part("attached_image", file_part);

        let client = blocking::Client::new();
        client
            .post(format!("{}/api/image", address))
            .bearer_auth(token_copy.as_str())
            .multipart(form)
            .send()
            .expect("Failed to execute request.")
    })
        .await
        .expect("Failed to multipart request");

    assert_eq!(200, response.status().as_u16());

    let response = client
        .get(
            format!(
                "{}/api/images?username={}&image_folder={}",
                app.address, metadata.username, metadata.image_folder
            ))
        .bearer_auth(token.as_str())
        .json(&metadata)
        .send()
        .await
        .expect("Failed to execute request.");

    assert_eq!(200, response.status().as_u16());

    let images_saved = response.json::<SavedImages>()
        .await
        .expect("Failed to deserialize response");
    assert_eq!(1, images_saved.count);
}

#[actix_rt::test]
async fn get_image_returns_a_200_for_valid_data() {
    let app = spawn_app().await;
    let client = reqwest::Client::new();

    let token = get_authorization_token(&client, &app).await;

    let metadata = Metadata {
        username: String::from("mock_username_get_image_200"),
        image_folder: String::from("mock_image_folder"),
    };

    let response = client
        .post(format!("{}/api/images", app.address))
        .bearer_auth(token.as_str())
        .json(&metadata)
        .send()
        .await
        .expect("Failed to execute request.");
    // Check if metadata upload was success before proceeding
    assert_eq!(200, response.status().as_u16());

    let address = app.address.clone();
    let token_copy = token.clone();
    let response = task::spawn_blocking(move || {
        let metadata_part = blocking::multipart::Part::text(
            "{\"username\": \"mock_username_get_image_200\", \"image_folder\": \"mock_image_folder\"}"
        )
            .mime_str("application/json")
            .expect("Failed to set content-type");
        let file_part = blocking::multipart::Part::file(
            "static/test_images/im1.png"
        )
            .expect("Failed to attach image to multipart")
            .mime_str("image/png")
            .expect("Failed to set content-type");
        let form = blocking::multipart::Form::new()
            .part("metadata", metadata_part)
            .part("attached_image", file_part);

        let client = blocking::Client::new();
        client
            .post(format!("{}/api/image", address))
            .bearer_auth(token_copy.clone())
            .multipart(form)
            .send()
            .expect("Failed to execute request.")
    })
        .await
        .expect("Failed multipart request");
    // Check if image upload was a success before proceeding
    assert_eq!(200, response.status().as_u16());

    let response = client
        .get(format!(
            "{}/api/images/im1.png?username=mock_username_get_image_200&image_folder=mock_image_folder",
            app.address))
        .bearer_auth(token.as_str())
        .send()
        .await
        .expect("Failed to execute request.");

    assert_eq!(200, response.status().as_u16());
    let tmp_dir = Builder::new().prefix("example").tempdir()
        .expect("Failed to create temporary download folder");
    let fname = response
        .url()
        .path_segments()
        .and_then(|segments| segments.last())
        .and_then(|name| if name.is_empty() { None } else { Some(name) })
        .expect("Failed to get filename");
    assert_eq!("im1.png", fname);
    let fname = tmp_dir.path().join(fname);
    let file_path = fname.display().to_string();

    let mut dest = fs::File::create(fname)
        .expect("Failed to create downloaded file");
    let mut content =  std::io::Cursor::new(response.bytes()
        .await
        .expect("Failed to read image")
    );
    std::io::copy(&mut content, &mut dest)
        .expect("Failed to copy image to file");

    assert!(Path::new(file_path.as_str()).exists());
}

#[actix_rt::test]
async fn get_image_returns_a_400_for_invalid_data() {
    let app = spawn_app().await;
    let client = reqwest::Client::new();

    let token = get_authorization_token(&client, &app).await;

    let response = client
        .get(format!(
            "{}/api/images/im1.png?username=mock_username_get_image_400&image_folder=mock_image_folder",
            app.address))
        .bearer_auth(token.as_str())
        .send()
        .await
        .expect("Failed to execute request.");

    assert_eq!(400, response.status().as_u16());
}

#[actix_rt::test]
async fn update_bbox_returns_a_200_for_valid_data() {
    let app = spawn_app().await;
    let client = reqwest::Client::new();

    let token = get_authorization_token(&client, &app).await;

    let metadata = Metadata {
        username: String::from("mock_username_update_bbox_200"),
        image_folder: String::from("mock_image_folder"),
    };

    let response = client
        .post(format!("{}/api/images", app.address))
        .bearer_auth(token.as_str())
        .json(&metadata)
        .send()
        .await
        .expect("Failed to execute request.");
    // Check if metadata upload was success before proceeding
    assert_eq!(200, response.status().as_u16());

    let address = app.address.clone();
    let token_copy = token.clone();
    let response = task::spawn_blocking(move || {
        let metadata_part = blocking::multipart::Part::text(
            "{\"username\": \"mock_username_update_bbox_200\", \"image_folder\": \"mock_image_folder\"}"
        )
            .mime_str("application/json")
            .expect("Failed to set content-type");
        let file_part = blocking::multipart::Part::file(
            "static/test_images/im1.png"
        )
            .expect("Failed to attach image to multipart")
            .mime_str("image/png")
            .expect("Failed to set content-type");
        let form = blocking::multipart::Form::new()
            .part("metadata", metadata_part)
            .part("attached_image", file_part);

        let client = blocking::Client::new();
        client
            .post(format!("{}/api/image", address))
            .bearer_auth(token_copy.as_str())
            .multipart(form)
            .send()
            .expect("Failed to execute request.")
    })
        .await
        .expect("Failed multipart request");
    // Check if image upload was a success before proceeding
    assert_eq!(200, response.status().as_u16());
    let bboxes = vec![(1,2,3,4), (4,52,46,64)];
    let image_labels = ImageLabels {
        image_id: String::from("im1.png"),
        bboxes: bboxes.clone(),
    };
    let response = client
        .post(format!(
            "{}/api/images/bbox/im1.png?username=mock_username_update_bbox_200&image_folder=mock_image_folder", app.address
        ))
        .bearer_auth(token.as_str())
        .json(&image_labels)
        .send()
        .await
        .expect("Failed to execute request.");

    assert_eq!(200, response.status().as_u16());

    let bboxes_db = sqlx::query!(
            r#"
            SELECT bbox
            FROM image_labels
            WHERE username=$1 AND image_folder=$2 AND image=$3
            "#,
            metadata.username, metadata.image_folder, "im1.png"
        )
        .fetch_all(&app.db_pool)
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
        .expect("Failed to execute query.");

    assert_eq!(bboxes_db, bboxes);
}

#[actix_rt::test]
async fn update_bbox_returns_a_400_for_invalid_data() {
    let app = spawn_app().await;
    let client = reqwest::Client::new();

    let token = get_authorization_token(&client, &app).await;

    let bboxes = vec![(1,2,3,4), (4,52,46,64)];
    let image_labels = ImageLabels {
        image_id: String::from("im1.png"),
        bboxes: bboxes.clone(),
    };
    let response = client
        .post(format!(
            "{}/api/images/bbox/im1.png?username=mock_username_update_bbox_400&image_folder=mock_image_folder", app.address
        ))
        .bearer_auth(token.as_str())
        .json(&image_labels)
        .send()
        .await
        .expect("Failed to execute request.");

    assert_eq!(400, response.status().as_u16());
}

#[actix_rt::test]
async fn get_bbox_returns_a_200_for_valid_data() {
    let app = spawn_app().await;
    let client = reqwest::Client::new();

    let token = get_authorization_token(&client, &app).await;

    let metadata = Metadata {
        username: String::from("mock_username_get_bbox_200"),
        image_folder: String::from("mock_image_folder"),
    };

    let response = client
        .post(format!("{}/api/images", app.address))
        .bearer_auth(token.as_str())
        .json(&metadata)
        .send()
        .await
        .expect("Failed to execute request.");
    // Check if metadata upload was success before proceeding
    assert_eq!(200, response.status().as_u16());

    let address = app.address.clone();
    let token_copy = token.clone();
    let response = task::spawn_blocking(move || {
        let metadata_part = blocking::multipart::Part::text(
            "{\"username\": \"mock_username_get_bbox_200\", \"image_folder\": \"mock_image_folder\"}"
        )
            .mime_str("application/json")
            .expect("Failed to set content-type");
        let file_part = blocking::multipart::Part::file(
            "static/test_images/im1.png"
        )
            .expect("Failed to attach image to multipart")
            .mime_str("image/png")
            .expect("Failed to set content-type");
        let form = blocking::multipart::Form::new()
            .part("metadata", metadata_part)
            .part("attached_image", file_part);

        let client = blocking::Client::new();
        client
            .post(format!("{}/api/image", address))
            .bearer_auth(token_copy.as_str())
            .multipart(form)
            .send()
            .expect("Failed to execute request.")
    })
        .await
        .expect("Failed multipart request");
    // Check if image upload was a success before proceeding
    assert_eq!(200, response.status().as_u16());
    let bboxes = vec![(1,2,3,4), (4,52,46,64)];
    let image_labels = ImageLabels {
        image_id: String::from("im1.png"),
        bboxes: bboxes.clone(),
    };
    let response = client
        .post(format!(
            "{}/api/images/bbox/im1.png?username=mock_username_get_bbox_200&image_folder=mock_image_folder", app.address
        ))
        .bearer_auth(token.as_str())
        .json(&image_labels)
        .send()
        .await
        .expect("Failed to execute request.");

    // Check if bboxes were updated correctly
    assert_eq!(200, response.status().as_u16());

    let response = client
        .get(format!(
            "{}/api/images/bbox/im1.png?username=mock_username_get_bbox_200&image_folder=mock_image_folder", app.address
        ))
        .bearer_auth(token.as_str())
        .send()
        .await
        .expect("Failed to execute request.");

    assert_eq!(200, response.status().as_u16());

    let image_label = response
        .json::<ImageLabels>()
        .await
        .expect("Failed to obtain image label");

    assert_eq!("im1.png", image_label.image_id);
    assert_eq!(image_label.bboxes, bboxes);
}

#[actix_rt::test]
async fn get_bbox_returns_a_400_for_invalid_data() {
    let app = spawn_app().await;
    let client = reqwest::Client::new();

    let token = get_authorization_token(&client, &app).await;

    let response = client
        .get(format!(
            "{}/api/images/bbox/im1.png?username=mock_username_get_bbox_400&image_folder=mock_image_folder", app.address
        ))
        .bearer_auth(token.as_str())
        .send()
        .await
        .expect("Failed to execute request.");

    assert_eq!(400, response.status().as_u16());
}