use rusqlite::params;
use tauri::AppHandle;

use crate::db::open_connection;
use crate::models::{CreateNamedOptionInput, UpdateNamedOptionInput};

// ── Environment options ───────────────────────────────────────────────────────

#[tauri::command]
pub fn create_environment_option(
    app: AppHandle,
    input: CreateNamedOptionInput,
) -> Result<(), String> {
    let conn = open_connection(&app)?;
    conn.execute(
        "INSERT INTO environment_options (name) VALUES (?1)",
        params![input.name.trim()],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn update_environment_option(
    app: AppHandle,
    input: UpdateNamedOptionInput,
) -> Result<(), String> {
    let conn = open_connection(&app)?;
    conn.execute(
        "UPDATE environment_options SET name = ?1 WHERE id = ?2",
        params![input.name.trim(), input.id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_environment_option(app: AppHandle, option_id: i64) -> Result<(), String> {
    let conn = open_connection(&app)?;
    conn.execute(
        "DELETE FROM environment_options WHERE id = ?1",
        params![option_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

// ── Device options ────────────────────────────────────────────────────────────

#[tauri::command]
pub fn create_device_option(
    app: AppHandle,
    input: CreateNamedOptionInput,
) -> Result<(), String> {
    let conn = open_connection(&app)?;
    conn.execute(
        "INSERT INTO device_options (name) VALUES (?1)",
        params![input.name.trim()],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn update_device_option(
    app: AppHandle,
    input: UpdateNamedOptionInput,
) -> Result<(), String> {
    let conn = open_connection(&app)?;
    conn.execute(
        "UPDATE device_options SET name = ?1 WHERE id = ?2",
        params![input.name.trim(), input.id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_device_option(app: AppHandle, option_id: i64) -> Result<(), String> {
    let conn = open_connection(&app)?;
    conn.execute(
        "DELETE FROM device_options WHERE id = ?1",
        params![option_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
