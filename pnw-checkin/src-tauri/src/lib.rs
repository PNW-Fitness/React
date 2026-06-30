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
fn set_export_dir(app: tauri::AppHandle, path: String) -> Result<(), String> {
    let config_dir = app
        .path()
        .app_local_data_dir()
        .map_err(|e| format!("Cannot find app data dir: {}", e))?;

    fs::create_dir_all(&config_dir)
        .map_err(|e| format!("Cannot create config directory: {}", e))?;

    let config = serde_json::json!({ "export_dir": path });
    fs::write(config_dir.join("config.json"), config.to_string())
        .map_err(|e| format!("Cannot write config: {}", e))?;

    Ok(())
}

#[tauri::command]
fn check_dir_writable(path: String) -> bool {
    let p = Path::new(&path);
    if !p.exists() || !p.is_dir() {
        return false;
    }
    let test_path = p.join(".pnw_write_test");
    match fs::write(&test_path, b"test") {
        Ok(_) => {
            let _ = fs::remove_file(&test_path);
            true
        }
        Err(_) => false,
    }
}

#[tauri::command]
fn write_guest_export(
    base_dir: String,
    date_str: String,
    subfolder: String,
    filename: String,
    pdf_b64: String,
) -> Result<String, String> {
    let dir = Path::new(&base_dir).join(&date_str).join(&subfolder);
    fs::create_dir_all(&dir)
        .map_err(|e| format!("Cannot create export folder: {}", e))?;

    let pdf_bytes = STANDARD
        .decode(&pdf_b64)
        .map_err(|e| format!("Cannot decode PDF: {}", e))?;
    let pdf_path = dir.join(format!("{}.pdf", filename));
    fs::write(&pdf_path, &pdf_bytes)
        .map_err(|e| format!("Cannot write PDF: {}", e))?;

    Ok(pdf_path.to_string_lossy().into_owned())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_prevent_default::Builder::new()
                .with_flags(Flags::empty())
                .platform(PlatformOptions {
                    general_autofill: false,
                    password_autosave: false,
                })
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_export_dir,
            set_export_dir,
            check_dir_writable,
            write_guest_export
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
