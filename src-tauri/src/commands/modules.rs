use rusqlite::params;
use tauri::AppHandle;

use crate::db::open_connection;
use crate::models::{CreateModuleInput, UpdateModuleInput};

#[tauri::command]
pub fn create_project_module(app: AppHandle, input: CreateModuleInput) -> Result<(), String> {
    let conn = open_connection(&app)?;
    conn.execute(
        "INSERT INTO project_modules (project_id, name, description) VALUES (?1, ?2, ?3)",
        params![input.project_id, input.name.trim(), input.description.trim()],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn update_project_module(app: AppHandle, input: UpdateModuleInput) -> Result<(), String> {
    let conn = open_connection(&app)?;
    conn.execute(
        "UPDATE project_modules SET name = ?1, description = ?2 WHERE id = ?3",
        params![input.name.trim(), input.description.trim(), input.id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_project_module(app: AppHandle, id: i64) -> Result<(), String> {
    let conn = open_connection(&app)?;
    conn.execute("DELETE FROM project_modules WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
