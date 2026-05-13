use rusqlite::params;
use tauri::AppHandle;

use crate::db::open_connection;

#[tauri::command]
pub fn create_checklist_item(app: AppHandle, plan_id: i64, title: String) -> Result<(), String> {
    let conn = open_connection(&app)?;
    conn.execute(
        "INSERT INTO checklist_items (plan_id, title, done) VALUES (?1, ?2, 0)",
        params![plan_id, title.trim()],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn set_checklist_done(app: AppHandle, checklist_id: i64, done: bool) -> Result<(), String> {
    let conn = open_connection(&app)?;
    conn.execute(
        "UPDATE checklist_items SET done = ?1 WHERE id = ?2",
        params![if done { 1 } else { 0 }, checklist_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn update_checklist_item(app: AppHandle, id: i64, title: String) -> Result<(), String> {
    let conn = open_connection(&app)?;
    conn.execute(
        "UPDATE checklist_items SET title = ?1 WHERE id = ?2",
        params![title.trim(), id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_checklist_item(app: AppHandle, id: i64) -> Result<(), String> {
    let conn = open_connection(&app)?;
    conn.execute(
        "DELETE FROM checklist_items WHERE id = ?1",
        params![id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
