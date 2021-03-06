#[derive(serde::Deserialize, serde::Serialize, Debug)]
pub struct Metadata {
    pub username: String,
    pub image_folder: String,
}

#[derive(serde::Deserialize, serde::Serialize, Debug)]
pub struct UserInfo {
    pub username: String,
}

#[derive(serde::Deserialize, serde::Serialize, Debug)]
pub struct ImageLabels {
    pub image_id: String,
    pub bboxes: Vec<(u32, u32, u32, u32)>,
}

#[derive(serde::Deserialize, serde::Serialize, Debug)]
pub struct SavedImages {
    pub images: Vec<String>,
    pub count: usize,
}

#[derive(serde::Deserialize, serde::Serialize, Debug)]
pub struct UserRequest {
    pub username: String,
    pub password: String,
}

#[derive(serde::Deserialize, serde::Serialize, Debug)]
pub struct LoginResponse {
    pub token: String,
}