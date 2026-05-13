use rusqlite::{params, OptionalExtension};
use tauri::AppHandle;

use crate::db::{open_connection, settings::reserve_next_test_case_id_value};
use crate::models::{CreateCaseInput, TestCaseIdSettings, UpdateTestCaseIdSettingsInput};
use crate::db::settings::{read_test_case_id_settings, save_test_case_id_settings};

#[tauri::command]
pub fn get_test_case_id_settings(app: AppHandle) -> Result<TestCaseIdSettings, String> {
    let conn = open_connection(&app)?;
    read_test_case_id_settings(&conn)
}

#[tauri::command]
pub fn update_test_case_id_settings(
    app: AppHandle,
    input: UpdateTestCaseIdSettingsInput,
) -> Result<TestCaseIdSettings, String> {
    let conn = open_connection(&app)?;
    save_test_case_id_settings(&conn, &input)
}

#[tauri::command]
pub fn reserve_next_test_case_id(app: AppHandle) -> Result<String, String> {
    let conn = open_connection(&app)?;
    reserve_next_test_case_id_value(&conn)
}

#[tauri::command]
pub fn create_test_case(app: AppHandle, input: CreateCaseInput) -> Result<(), String> {
    let mut conn = open_connection(&app)?;
    let mut resolved_case_id = input.test_case_id.trim().to_string();
    if resolved_case_id.is_empty() {
        resolved_case_id = reserve_next_test_case_id_value(&conn)?;
    }

    let duplicate = conn
        .query_row(
            "SELECT id FROM test_cases WHERE test_case_id = ?1 LIMIT 1",
            params![resolved_case_id.as_str()],
            |row| row.get::<_, i64>(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;

    if duplicate.is_some() {
        return Err(format!("Test case ID already exists: {resolved_case_id}"));
    }

    let tx = conn.transaction().map_err(|e| e.to_string())?;
    tx.execute(
        "INSERT INTO test_cases (
            test_case_id, title, case_type, related_feature, priority,
            preconditions, steps, test_data, expected_result,
            actual_result, status, bug_id_or_comments, notes
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        params![
            resolved_case_id,
            input.title.trim(),
            input.case_type.trim(),
            input.related_feature.trim(),
            input.priority.trim(),
            input.preconditions.trim(),
            input.steps.trim(),
            input.test_data.trim(),
            input.expected_result.trim(),
            input.actual_result.trim(),
            input.status.trim(),
            input.bug_id_or_comments.trim(),
            input.notes.trim()
        ],
    )
    .map_err(|e| e.to_string())?;
    let case_id = tx.last_insert_rowid();
    for module_id in input.module_ids {
        tx.execute(
            "INSERT OR IGNORE INTO case_module_links (case_id, module_id) VALUES (?1, ?2)",
            params![case_id, module_id],
        )
        .map_err(|e| e.to_string())?;
    }
    for plan_id in input.linked_plan_ids {
        tx.execute(
            "INSERT OR IGNORE INTO plan_case_links (plan_id, case_id) VALUES (?1, ?2)",
            params![plan_id, case_id],
        )
        .map_err(|e| e.to_string())?;
    }
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn set_case_plan_link(
    app: AppHandle,
    plan_id: i64,
    case_id: i64,
    linked: bool,
) -> Result<(), String> {
    let conn = open_connection(&app)?;
    if linked {
        conn.execute(
            "INSERT OR IGNORE INTO plan_case_links (plan_id, case_id) VALUES (?1, ?2)",
            params![plan_id, case_id],
        )
        .map_err(|e| e.to_string())?;
    } else {
        conn.execute(
            "DELETE FROM plan_case_links WHERE plan_id = ?1 AND case_id = ?2",
            params![plan_id, case_id],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}


#[tauri::command]
pub fn update_test_case(app: AppHandle, id: i64, input: CreateCaseInput) -> Result<(), String> {
    let mut conn = open_connection(&app)?;
    
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    tx.execute(
        "UPDATE test_cases SET 
            test_case_id = ?1,
            title = ?2,
            case_type = ?3,
            related_feature = ?4,
            priority = ?5,
            preconditions = ?6,
            steps = ?7,
            test_data = ?8,
            expected_result = ?9,
            actual_result = ?10,
            status = ?11,
            bug_id_or_comments = ?12,
            notes = ?13
        WHERE id = ?14",
        params![
            input.test_case_id.trim(),
            input.title.trim(),
            input.case_type.trim(),
            input.related_feature.trim(),
            input.priority.trim(),
            input.preconditions.trim(),
            input.steps.trim(),
            input.test_data.trim(),
            input.expected_result.trim(),
            input.actual_result.trim(),
            input.status.trim(),
            input.bug_id_or_comments.trim(),
            input.notes.trim(),
            id
        ],
    )
    .map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM case_module_links WHERE case_id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    for module_id in input.module_ids {
        tx.execute(
            "INSERT OR IGNORE INTO case_module_links (case_id, module_id) VALUES (?1, ?2)",
            params![id, module_id],
        )
        .map_err(|e| e.to_string())?;
    }
    tx.execute("DELETE FROM plan_case_links WHERE case_id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    for plan_id in input.linked_plan_ids {
        tx.execute(
            "INSERT OR IGNORE INTO plan_case_links (plan_id, case_id) VALUES (?1, ?2)",
            params![plan_id, id],
        )
        .map_err(|e| e.to_string())?;
    }
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_test_case(app: AppHandle, id: i64) -> Result<(), String> {
    let conn = open_connection(&app)?;
    conn.execute("DELETE FROM test_cases WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
