use rusqlite::{params, OptionalExtension};
use tauri::AppHandle;

use crate::db::open_connection;
use crate::models::CreateTestResultInput;

fn sync_test_case_latest_result(conn: &rusqlite::Connection, case_id: i64) -> Result<(), String> {
    let latest = conn
        .query_row(
            "SELECT result_status, actual_result, bug_id_or_comments
             FROM test_results
             WHERE case_id = ?1
             ORDER BY datetime(executed_at) DESC, id DESC
             LIMIT 1",
            params![case_id],
            |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                ))
            },
        )
        .optional()
        .map_err(|e| e.to_string())?;

    match latest {
        Some((status, actual_result, bug_id_or_comments)) => {
            conn.execute(
                "UPDATE test_cases
                 SET actual_result = ?1, status = ?2, bug_id_or_comments = ?3
                 WHERE id = ?4",
                params![actual_result, status, bug_id_or_comments, case_id],
            )
            .map_err(|e| e.to_string())?;
        }
        None => {
            conn.execute(
                "UPDATE test_cases
                 SET actual_result = '', status = 'not-run', bug_id_or_comments = ''
                 WHERE id = ?1",
                params![case_id],
            )
            .map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

#[tauri::command]
pub fn create_test_result(app: AppHandle, input: CreateTestResultInput) -> Result<(), String> {
    let conn = open_connection(&app)?;
    let existing_id = if let Some(plan_id) = input.plan_id {
        conn.query_row(
            "SELECT id
             FROM test_results
             WHERE case_id = ?1 AND plan_id = ?2
             ORDER BY datetime(executed_at) DESC, id DESC
             LIMIT 1",
            params![input.case_id, plan_id],
            |row| row.get::<_, i64>(0),
        )
        .optional()
        .map_err(|e| e.to_string())?
    } else {
        conn.query_row(
            "SELECT id
             FROM test_results
             WHERE case_id = ?1 AND plan_id IS NULL
             ORDER BY datetime(executed_at) DESC, id DESC
             LIMIT 1",
            params![input.case_id],
            |row| row.get::<_, i64>(0),
        )
        .optional()
        .map_err(|e| e.to_string())?
    };

    let attachments_json = serde_json::to_string(
        &input.attachments.as_deref().unwrap_or(&[])
    ).unwrap_or_else(|_| "[]".to_string());

    if let Some(id) = existing_id {
        conn.execute(
            "UPDATE test_results SET
                result_status = ?1,
                tested_by = ?2,
                environment = ?3,
                tested_device = ?4,
                actual_result = ?5,
                bug_id_or_comments = ?6,
                attachments = ?7,
                executed_at = datetime('now')
             WHERE id = ?8",
            params![
                input.result_status.trim(),
                input.tested_by.trim(),
                input.environment.trim(),
                input.tested_device.trim(),
                input.actual_result.trim(),
                input.bug_id_or_comments.trim(),
                attachments_json,
                id
            ],
        )
        .map_err(|e| e.to_string())?;
    } else {
        conn.execute(
            "INSERT INTO test_results (
                case_id, plan_id, result_status, tested_by,
                environment, tested_device, actual_result,
                bug_id_or_comments, attachments, executed_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, datetime('now'))",
            params![
                input.case_id,
                input.plan_id,
                input.result_status.trim(),
                input.tested_by.trim(),
                input.environment.trim(),
                input.tested_device.trim(),
                input.actual_result.trim(),
                input.bug_id_or_comments.trim(),
                attachments_json
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    sync_test_case_latest_result(&conn, input.case_id)?;

    Ok(())
}

#[tauri::command]
pub async fn update_test_result(
    app: tauri::AppHandle,
    id: i64,
    input: CreateTestResultInput,
) -> Result<(), String> {
    let conn = open_connection(&app)?;
    let previous_case_id = conn
        .query_row(
            "SELECT case_id FROM test_results WHERE id = ?1",
            params![id],
            |row| row.get::<_, i64>(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;

    let attachments_json = serde_json::to_string(
        &input.attachments.as_deref().unwrap_or(&[])
    ).unwrap_or_else(|_| "[]".to_string());

    conn.execute(
        "UPDATE test_results SET
            case_id = ?1, plan_id = ?2, result_status = ?3,
            tested_by = ?4, environment = ?5, tested_device = ?6,
            actual_result = ?7, bug_id_or_comments = ?8,
            attachments = ?9
         WHERE id = ?10",
        params![
            input.case_id,
            input.plan_id,
            input.result_status,
            input.tested_by,
            input.environment,
            input.tested_device,
            input.actual_result,
            input.bug_id_or_comments,
            attachments_json,
            id
        ],
    )
    .map_err(|e| e.to_string())?;
    if let Some(old_case_id) = previous_case_id {
        if old_case_id != input.case_id {
            sync_test_case_latest_result(&conn, old_case_id)?;
        }
    }
    sync_test_case_latest_result(&conn, input.case_id)?;
    Ok(())
}

#[tauri::command]
pub async fn delete_test_result(app: tauri::AppHandle, id: i64) -> Result<(), String> {
    let conn = open_connection(&app)?;
    let case_id = conn
        .query_row(
            "SELECT case_id FROM test_results WHERE id = ?1",
            params![id],
            |row| row.get::<_, i64>(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM test_results WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    if let Some(case_id) = case_id {
        sync_test_case_latest_result(&conn, case_id)?;
    }
    Ok(())
}
