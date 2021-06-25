#[derive(serde::Deserialize, serde::Serialize, Debug)]
pub struct Metadata {
    pub username: String,
    pub image_folder: String,
}

#[derive(serde::Deserialize, serde::Serialize)]
pub struct ImageLabels {
    pub image_id: String,
    pub bboxes: Vec<(u32, u32, u32, u32)>,
}