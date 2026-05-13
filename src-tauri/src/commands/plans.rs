use rusqlite::params;
use tauri::AppHandle;

use crate::db::open_connection;
use crate::models::CreatePlanInput;

#[tauri::command]
pub fn create_test_plan(app: AppHandle, input: CreatePlanInput) -> Result<i64, String> {
    let conn = open_connection(&app)?;
    conn.execute(
        "INSERT INTO test_plans (
            project_id, name, feature_module, testing_goal,
            scope_in, scope_out, tester_name, start_date,
            end_date, test_environment, risks_notes
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![
            input.project_id,
            input.name.trim(),
            input.feature_module.trim(),
            input.testing_goal.trim(),
            input.scope_in.trim(),
            input.scope_out.trim(),
            input.tester_name.trim(),
            input.start_date.trim(),
            input.end_date.trim(),
            input.test_environment.trim(),
            input.risks_notes.trim()
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub fn update_test_plan(app: AppHandle, id: i64, input: CreatePlanInput) -> Result<(), String> {
    let conn = open_connection(&app)?;
    conn.execute(
        "UPDATE test_plans SET
            project_id = ?1,
            name = ?2,
            feature_module = ?3,
            testing_goal = ?4,
            scope_in = ?5,
            scope_out = ?6,
            tester_name = ?7,
            start_date = ?8,
            end_date = ?9,
            test_environment = ?10,
            risks_notes = ?11
        WHERE id = ?12",
        params![
            input.project_id,
            input.name.trim(),
            input.feature_module.trim(),
            input.testing_goal.trim(),
            input.scope_in.trim(),
            input.scope_out.trim(),
            input.tester_name.trim(),
            input.start_date.trim(),
            input.end_date.trim(),
            input.test_environment.trim(),
            input.risks_notes.trim(),
            id
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_test_plan(app: AppHandle, id: i64) -> Result<(), String> {
    let conn = open_connection(&app)?;
    conn.execute("DELETE FROM plan_case_links WHERE plan_id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM checklist_items WHERE plan_id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM test_results WHERE plan_id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM test_plans WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
