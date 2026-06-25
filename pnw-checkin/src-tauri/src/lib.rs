use std::fs;
use std::path::Path;
use base64::{engine::general_purpose::STANDARD, Engine as _};
use tauri::Manager;
use tauri_plugin_prevent_default::{Flags, PlatformOptions};

#[tauri::command]
fn get_export_dir(app: tauri::AppHandle) -> Result<String, String> {
    let config_path = app
        .path()
        .app_local_data_dir()
        .map_err(|e| format!("Cannot find app data dir: {}", e))?
        .join("config.json");

    if config_path.exists() {
        if let Ok(contents) = fs::read_to_string(&config_path) {
            if let Ok(val) = serde_json::from_str::<serde_json::Value>(&contents) {
                if let Some(dir) = val.get("export_dir").and_then(|v| v.as_str()) {
                    return Ok(dir.to_string());
                }
            }
        }
    }

    // Default: Documents\PNW-GuestRecords
    let docs = app
        .path()
        .document_dir()
        .map_err(|e| format!("Cannot find Documents folder: {}", e))?;
    Ok(docs.join("PNW-GuestRecords").to_string_lossy().into_owned())
}

#[tauri::command]
fn write_guest_export(
    base_dir: String,
    date_str: String,
    guest_folder: String,
    id_photo_b64: String,
    pdf_b64: String,
    metadata_json: String,
) -> Result<(String, String), String> {
    let dir = Path::new(&base_dir).join(&date_str).join(&guest_folder);
    fs::create_dir_all(&dir)
        .map_err(|e| format!("Cannot create guest folder: {}", e))?;

    let photo_bytes = STANDARD
        .decode(&id_photo_b64)
        .map_err(|e| format!("Cannot decode ID photo: {}", e))?;
    let photo_path = dir.join("id_photo.jpg");
    fs::write(&photo_path, &photo_bytes)
        .map_err(|e| format!("Cannot write ID photo: {}", e))?;

    let pdf_bytes = STANDARD
        .decode(&pdf_b64)
        .map_err(|e| format!("Cannot decode PDF: {}", e))?;
    let pdf_path = dir.join("waiver_signed.pdf");
    fs::write(&pdf_path, &pdf_bytes)
        .map_err(|e| format!("Cannot write PDF: {}", e))?;

    let meta_path = dir.join("metadata.json");
    fs::write(&meta_path, metadata_json.as_bytes())
        .map_err(|e| format!("Cannot write metadata: {}", e))?;

    Ok((
        photo_path.to_string_lossy().into_owned(),
        pdf_path.to_string_lossy().into_owned(),
    ))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_prevent_default::Builder::new()
                .with_flags(Flags::empty())   // no keyboard/pointer shortcut blocking
                .platform(PlatformOptions {
                    general_autofill: false,
                    password_autosave: false,
                })
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .invoke_handler(tauri::generate_handler![get_export_dir, write_guest_export])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
