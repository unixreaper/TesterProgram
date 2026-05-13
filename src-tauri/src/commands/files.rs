use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager;

#[tauri::command]
pub async fn save_attachment(app: AppHandle, temp_path: String) -> Result<String, String> {
    let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let attachments_dir = data_dir.join("attachments");
    
    if !attachments_dir.exists() {
        fs::create_dir_all(&attachments_dir).map_err(|e| e.to_string())?;
    }

    let src = PathBuf::from(&temp_path);
    if !src.exists() {
        return Err("Source file does not exist".to_string());
    }

    let file_name = src.file_name().ok_or("Invalid file name")?.to_string_lossy();
    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S").to_string();
    let new_file_name = format!("{}_{}", timestamp, file_name);
    let dest = attachments_dir.join(&new_file_name);

    fs::copy(&src, &dest).map_err(|e| e.to_string())?;

    Ok(new_file_name)
}

#[tauri::command]
pub async fn pick_file() -> Result<Option<String>, String> {
    let file = rfd::AsyncFileDialog::new()
        .add_filter("Images", &["png", "jpg", "jpeg", "gif", "webp", "bmp"])
        .add_filter("Documents", &["pdf", "txt", "docx", "xlsx", "csv"])
        .add_filter("All Files", &["*"])
        .pick_file()
        .await;

    Ok(file.map(|f| f.path().to_string_lossy().to_string()))
}

#[tauri::command]
pub async fn get_attachment_url(app: AppHandle, file_name: String) -> Result<String, String> {
    let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let path = data_dir.join("attachments").join(&file_name);
    
    if !path.exists() {
        return Err(format!("File not found: {}", file_name));
    }

    Ok(path.to_string_lossy().to_string())
}

/// Read an attachment file as base64 for image preview
#[tauri::command]
pub async fn read_attachment_base64(app: AppHandle, file_name: String) -> Result<String, String> {
    let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let path = data_dir.join("attachments").join(&file_name);
    
    if !path.exists() {
        return Err(format!("File not found: {}", file_name));
    }

    let bytes = fs::read(&path).map_err(|e| e.to_string())?;
    let ext = path.extension()
        .and_then(|e| e.to_str())
        .unwrap_or("bin")
        .to_lowercase();
    
    let mime = match ext.as_str() {
        "png"  => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif"  => "image/gif",
        "webp" => "image/webp",
        "bmp"  => "image/bmp",
        "pdf"  => "application/pdf",
        _      => "application/octet-stream",
    };

    use std::io::Write;
    let mut buf = Vec::new();
    let engine = base64_engine();
    write!(buf, "data:{};base64,{}", mime, base64_encode(&engine, &bytes))
        .map_err(|e| e.to_string())?;
    
    Ok(String::from_utf8(buf).map_err(|e| e.to_string())?)
}

fn base64_engine() -> base64::engine::GeneralPurpose {
    use base64::engine::general_purpose::STANDARD;
    STANDARD
}

fn base64_encode(engine: &base64::engine::GeneralPurpose, data: &[u8]) -> String {
    use base64::Engine;
    engine.encode(data)
}

/// Open file with system default application
#[tauri::command]
pub async fn open_attachment(app: AppHandle, file_name: String) -> Result<(), String> {
    let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let path = data_dir.join("attachments").join(&file_name);
    
    if !path.exists() {
        return Err(format!("File not found: {}", file_name));
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Reveal file in Finder/Explorer
#[tauri::command]
pub async fn reveal_attachment(app: AppHandle, file_name: String) -> Result<(), String> {
    let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let path = data_dir.join("attachments").join(&file_name);
    
    if !path.exists() {
        return Err(format!("File not found: {}", file_name));
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg("-R")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg("/select,")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        // Open the parent directory
        if let Some(parent) = path.parent() {
            std::process::Command::new("xdg-open")
                .arg(parent)
                .spawn()
                .map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

/// Save attachment to a user-chosen location
#[tauri::command]
pub async fn save_attachment_as(app: AppHandle, file_name: String) -> Result<Option<String>, String> {
    let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let src_path = data_dir.join("attachments").join(&file_name);
    
    if !src_path.exists() {
        return Err(format!("File not found: {}", file_name));
    }

    // Strip the timestamp prefix (YYYYMMDD_HHMMSS_) to get original name
    let original_name = if file_name.len() > 16 && file_name.chars().nth(15) == Some('_') {
        &file_name[16..]
    } else {
        &file_name
    };

    let dest = rfd::AsyncFileDialog::new()
        .set_file_name(original_name)
        .save_file()
        .await;

    match dest {
        Some(handle) => {
            let dest_path = handle.path();
            fs::copy(&src_path, dest_path).map_err(|e| e.to_string())?;
            Ok(Some(dest_path.to_string_lossy().to_string()))
        }
        None => Ok(None),
    }
}

/// Generic open path with system default application
#[tauri::command]
pub async fn open_path(path: String) -> Result<(), String> {
    let path = std::path::PathBuf::from(path);
    if !path.exists() {
        return Err("File not found".to_string());
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "windows")]
    {
        // Use "cmd /c start" or "explorer"
        std::process::Command::new("cmd")
            .arg("/c")
            .arg("start")
            .arg("")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub async fn cleanup_orphaned_attachments(app: AppHandle) -> Result<u32, String> {
    use crate::db::open_connection;
    use std::collections::HashSet;

    let conn = open_connection(&app)?;
    let mut stmt = conn
        .prepare("SELECT attachments FROM test_results")
        .map_err(|e| e.to_string())?;
    
    let rows = stmt
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?;

    let mut referenced_files = HashSet::new();
    for row in rows {
        if let Ok(json_str) = row {
            if let Ok(files) = serde_json::from_str::<Vec<String>>(&json_str) {
                for f in files {
                    referenced_files.insert(f);
                }
            }
        }
    }

    let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let attachments_dir = data_dir.join("attachments");
    
    if !attachments_dir.exists() {
        return Ok(0);
    }

    let mut deleted_count = 0;
    let entries = fs::read_dir(attachments_dir).map_err(|e| e.to_string())?;
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.is_file() {
            if let Some(file_name) = path.file_name().and_then(|n| n.to_str()) {
                if !referenced_files.contains(file_name) {
                    fs::remove_file(path).map_err(|e| e.to_string())?;
                    deleted_count += 1;
                }
            }
        }
    }

    Ok(deleted_count)
}
