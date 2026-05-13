use rusqlite::params;
use tauri::AppHandle;

use crate::db::open_connection;
use crate::models::{CreateProjectInput, UpdateProjectInput};

#[tauri::command]
pub fn create_project(app: AppHandle, input: CreateProjectInput) -> Result<(), String> {
    let conn = open_connection(&app)?;
    conn.execute(
        "INSERT INTO projects (name, description) VALUES (?1, ?2)",
        params![input.name.trim(), input.description.trim()],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn update_project(app: AppHandle, input: UpdateProjectInput) -> Result<(), String> {
    let conn = open_connection(&app)?;
    conn.execute(
        "UPDATE projects SET name = ?1, description = ?2 WHERE id = ?3",
        params![input.name.trim(), input.description.trim(), input.id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_project(app: AppHandle, project_id: i64) -> Result<(), String> {
    let conn = open_connection(&app)?;

    let mut plan_ids_stmt = conn
        .prepare("SELECT id FROM test_plans WHERE project_id = ?1")
        .map_err(|e| e.to_string())?;
    let plan_ids = plan_ids_stmt
        .query_map(params![project_id], |row| row.get::<_, i64>(0))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    for plan_id in plan_ids {
        conn.execute("DELETE FROM plan_case_links WHERE plan_id = ?1", params![plan_id])
            .map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM checklist_items WHERE plan_id = ?1", params![plan_id])
            .map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM test_results WHERE plan_id = ?1", params![plan_id])
            .map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM test_plans WHERE id = ?1", params![plan_id])
            .map_err(|e| e.to_string())?;
    }

    conn.execute("DELETE FROM projects WHERE id = ?1", params![project_id])
        .map_err(|e| e.to_string())?;

    Ok(())
}
