use std::{fs, io::Cursor, path::PathBuf, time::{SystemTime, UNIX_EPOCH}};

use calamine::{Data, Reader, Xlsx};
use rfd::FileDialog;
use rusqlite::Connection;
use rust_xlsxwriter::{Color, Format, FormatAlign, Workbook, Worksheet};
use serde::Serialize;
use tauri::{AppHandle, Manager};

use crate::db::open_connection;

fn export_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let mut dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    dir.push("exports");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

fn choose_save_path(default_file_name: &str, filter_name: &str, extensions: &[&str]) -> Result<PathBuf, String> {
    FileDialog::new()
        .set_file_name(default_file_name)
        .add_filter(filter_name, extensions)
        .save_file()
        .ok_or_else(|| "Save cancelled".to_string())
}

fn timestamp() -> String {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs().to_string())
        .unwrap_or_else(|_| "now".to_string())
}

fn header_format() -> Format {
    Format::new()
        .set_bold()
        .set_font_color(Color::White)
        .set_background_color(Color::RGB(0x0E639C))
        .set_align(FormatAlign::Center)
}

fn write_headers(sheet: &mut Worksheet, headers: &[&str]) -> Result<(), String> {
    let format = header_format();
    for (index, header) in headers.iter().enumerate() {
        sheet
            .write_string_with_format(0, index as u16, *header, &format)
            .map_err(|e| e.to_string())?;
        sheet
            .set_column_width(index as u16, 18.0)
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn write_string(sheet: &mut Worksheet, row: u32, col: u16, value: String) -> Result<(), String> {
    sheet
        .write_string(row, col, value)
        .map(|_| ())
        .map_err(|e| e.to_string())
}

fn export_plans_sheet(conn: &Connection, workbook: &mut Workbook) -> Result<(), String> {
    let sheet = workbook.add_worksheet();
    sheet.set_name("Test Plans").map_err(|e| e.to_string())?;
    write_headers(
        sheet,
        &[
            "Project",
            "Plan",
            "Goal",
            "In Scope",
            "Out Scope",
            "Tester",
            "Start",
            "End",
            "Environment",
            "Risks / Notes",
            "Created",
        ],
    )?;

    let mut stmt = conn
        .prepare(
            "SELECT p.name, tp.name, tp.testing_goal, tp.scope_in, tp.scope_out,
                    tp.tester_name, tp.start_date, tp.end_date, tp.test_environment,
                    tp.risks_notes, tp.created_at
             FROM test_plans tp
             LEFT JOIN projects p ON p.id = tp.project_id
             ORDER BY p.name, tp.name",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok([
                row.get::<_, String>(0).unwrap_or_default(),
                row.get::<_, String>(1).unwrap_or_default(),
                row.get::<_, String>(2).unwrap_or_default(),
                row.get::<_, String>(3).unwrap_or_default(),
                row.get::<_, String>(4).unwrap_or_default(),
                row.get::<_, String>(5).unwrap_or_default(),
                row.get::<_, String>(6).unwrap_or_default(),
                row.get::<_, String>(7).unwrap_or_default(),
                row.get::<_, String>(8).unwrap_or_default(),
                row.get::<_, String>(9).unwrap_or_default(),
                row.get::<_, String>(10).unwrap_or_default(),
            ])
        })
        .map_err(|e| e.to_string())?;

    for (row_index, row) in rows.enumerate() {
        for (col_index, value) in row.map_err(|e| e.to_string())?.into_iter().enumerate() {
            write_string(sheet, row_index as u32 + 1, col_index as u16, value)?;
        }
    }
    Ok(())
}

fn export_cases_sheet(conn: &Connection, workbook: &mut Workbook) -> Result<(), String> {
    let sheet = workbook.add_worksheet();
    sheet.set_name("Test Cases").map_err(|e| e.to_string())?;
    write_headers(
        sheet,
        &[
            "Case ID",
            "Title",
            "Type",
            "Modules",
            "Priority",
            "Status",
            "Linked Plans",
            "Preconditions",
            "Steps",
            "Test Data",
            "Expected",
            "Actual",
            "Bug / Comment",
            "Notes",
            "Created",
        ],
    )?;

    let mut stmt = conn
        .prepare(
            "SELECT tc.test_case_id, tc.title, tc.case_type, tc.related_feature, tc.priority,
                    tc.status,
                    COALESCE((SELECT group_concat(tp.name, ', ')
                              FROM plan_case_links pcl
                              JOIN test_plans tp ON tp.id = pcl.plan_id
                              WHERE pcl.case_id = tc.id), ''),
                    tc.preconditions, tc.steps, tc.test_data, tc.expected_result,
                    tc.actual_result, tc.bug_id_or_comments, tc.notes, tc.created_at
             FROM test_cases tc
             ORDER BY tc.test_case_id",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok([
                row.get::<_, String>(0).unwrap_or_default(),
                row.get::<_, String>(1).unwrap_or_default(),
                row.get::<_, String>(2).unwrap_or_default(),
                row.get::<_, String>(3).unwrap_or_default(),
                row.get::<_, String>(4).unwrap_or_default(),
                row.get::<_, String>(5).unwrap_or_default(),
                row.get::<_, String>(6).unwrap_or_default(),
                row.get::<_, String>(7).unwrap_or_default(),
                row.get::<_, String>(8).unwrap_or_default(),
                row.get::<_, String>(9).unwrap_or_default(),
                row.get::<_, String>(10).unwrap_or_default(),
                row.get::<_, String>(11).unwrap_or_default(),
                row.get::<_, String>(12).unwrap_or_default(),
                row.get::<_, String>(13).unwrap_or_default(),
                row.get::<_, String>(14).unwrap_or_default(),
            ])
        })
        .map_err(|e| e.to_string())?;

    for (row_index, row) in rows.enumerate() {
        for (col_index, value) in row.map_err(|e| e.to_string())?.into_iter().enumerate() {
            write_string(sheet, row_index as u32 + 1, col_index as u16, value)?;
        }
    }
    Ok(())
}

fn export_results_sheet(conn: &Connection, workbook: &mut Workbook) -> Result<(), String> {
    let sheet = workbook.add_worksheet();
    sheet.set_name("Test Results").map_err(|e| e.to_string())?;
    write_headers(
        sheet,
        &[
            "Executed At",
            "Project",
            "Plan",
            "Case ID",
            "Case Title",
            "Status",
            "Tester",
            "Environment",
            "Device",
            "Actual Result",
            "Bug / Comment",
        ],
    )?;

    let mut stmt = conn
        .prepare(
            "SELECT tr.executed_at, p.name, tp.name, tc.test_case_id, tc.title,
                    tr.result_status, tr.tested_by, tr.environment, tr.tested_device,
                    tr.actual_result, tr.bug_id_or_comments
             FROM test_results tr
             LEFT JOIN test_cases tc ON tc.id = tr.case_id
             LEFT JOIN test_plans tp ON tp.id = tr.plan_id
             LEFT JOIN projects p ON p.id = tp.project_id
             ORDER BY datetime(tr.executed_at) DESC, tr.id DESC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok([
                row.get::<_, String>(0).unwrap_or_default(),
                row.get::<_, String>(1).unwrap_or_default(),
                row.get::<_, String>(2).unwrap_or_default(),
                row.get::<_, String>(3).unwrap_or_default(),
                row.get::<_, String>(4).unwrap_or_default(),
                row.get::<_, String>(5).unwrap_or_default(),
                row.get::<_, String>(6).unwrap_or_default(),
                row.get::<_, String>(7).unwrap_or_default(),
                row.get::<_, String>(8).unwrap_or_default(),
                row.get::<_, String>(9).unwrap_or_default(),
                row.get::<_, String>(10).unwrap_or_default(),
            ])
        })
        .map_err(|e| e.to_string())?;

    for (row_index, row) in rows.enumerate() {
        for (col_index, value) in row.map_err(|e| e.to_string())?.into_iter().enumerate() {
            write_string(sheet, row_index as u32 + 1, col_index as u16, value)?;
        }
    }
    Ok(())
}

fn export_import_template_sheet(workbook: &mut Workbook) -> Result<(), String> {
    let sheet = workbook.add_worksheet();
    sheet
        .set_name("Import Test Cases")
        .map_err(|e| e.to_string())?;
    write_headers(
        sheet,
        &[
            "Project",
            "Plan",
            "Case ID",
            "Title",
            "Type",
            "Modules",
            "Priority",
            "Status",
            "Preconditions",
            "Steps",
            "Test Data",
            "Expected",
            "Actual",
            "Bug / Comment",
            "Notes",
        ],
    )?;
    Ok(())
}

fn export_plan_case_mapping_sheet(conn: &Connection, workbook: &mut Workbook) -> Result<(), String> {
    let sheet = workbook.add_worksheet();
    sheet
        .set_name("Plan-Case Mapping")
        .map_err(|e| e.to_string())?;
    write_headers(
        sheet,
        &[
            "Project",
            "Plan",
            "Case ID",
            "Case Title",
            "Linked At",
        ],
    )?;

    let mut stmt = conn
        .prepare(
            "SELECT p.name, tp.name, tc.test_case_id, tc.title, pcl.created_at
             FROM plan_case_links pcl
             JOIN test_plans tp ON tp.id = pcl.plan_id
             LEFT JOIN projects p ON p.id = tp.project_id
             JOIN test_cases tc ON tc.id = pcl.case_id
             ORDER BY p.name, tp.name, tc.test_case_id",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok([
                row.get::<_, String>(0).unwrap_or_default(),
                row.get::<_, String>(1).unwrap_or_default(),
                row.get::<_, String>(2).unwrap_or_default(),
                row.get::<_, String>(3).unwrap_or_default(),
                row.get::<_, String>(4).unwrap_or_default(),
            ])
        })
        .map_err(|e| e.to_string())?;

    for (row_index, row) in rows.enumerate() {
        for (col_index, value) in row.map_err(|e| e.to_string())?.into_iter().enumerate() {
            write_string(sheet, row_index as u32 + 1, col_index as u16, value)?;
        }
    }
    Ok(())
}

#[derive(Debug)]
struct ImportRow {
    row_number: usize,
    project: String,
    plan: String,
    case_id: String,
    title: String,
    case_type: String,
    modules: String,
    priority: String,
    status: String,
    preconditions: String,
    steps: String,
    test_data: String,
    expected: String,
    actual: String,
    bug_comment: String,
    notes: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportFailure {
    pub row_number: usize,
    pub reason: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportSummary {
    pub total_rows: usize,
    pub success_rows: usize,
    pub failed_rows: usize,
    pub failures: Vec<ImportFailure>,
    pub requires_decision: bool,
}

fn data_to_string(cell: Option<&Data>) -> String {
    match cell {
        Some(Data::String(v)) => v.trim().to_string(),
        Some(Data::Float(v)) => {
            if v.fract() == 0.0 {
                format!("{v:.0}")
            } else {
                v.to_string()
            }
        }
        Some(Data::Int(v)) => v.to_string(),
        Some(Data::Bool(v)) => v.to_string(),
        Some(Data::DateTime(v)) => v.to_string(),
        Some(Data::DateTimeIso(v)) => v.trim().to_string(),
        Some(Data::DurationIso(v)) => v.trim().to_string(),
        Some(Data::Error(_)) | Some(Data::Empty) | None => String::new(),
    }
}

fn validate_import_row(conn: &Connection, row: &ImportRow) -> Result<(), String> {
    if row.plan.is_empty() {
        return Err("Plan is required".to_string());
    }
    if row.case_id.is_empty() {
        return Err("Case ID is required".to_string());
    }
    if row.title.is_empty() {
        return Err("Title is required".to_string());
    }
    let plan_exists = if row.project.is_empty() {
        conn.query_row(
            "SELECT id FROM test_plans WHERE name = ?1 LIMIT 1",
            [row.plan.as_str()],
            |_r| Ok(()),
        )
    } else {
        conn.query_row(
            "SELECT tp.id
             FROM test_plans tp
             JOIN projects p ON p.id = tp.project_id
             WHERE tp.name = ?1 AND p.name = ?2
             LIMIT 1",
            [row.plan.as_str(), row.project.as_str()],
            |_r| Ok(()),
        )
    };
    match plan_exists {
        Ok(_) => Ok(()),
        Err(_) => Err("Plan not found (check Project/Plan names)".to_string()),
    }
}

fn import_one_row(conn: &Connection, row: &ImportRow) -> Result<(), String> {
    let plan_id: i64 = if row.project.is_empty() {
        conn.query_row(
            "SELECT id FROM test_plans WHERE name = ?1 ORDER BY id LIMIT 1",
            [row.plan.as_str()],
            |r| r.get(0),
        )
        .map_err(|_| "Plan not found".to_string())?
    } else {
        conn.query_row(
            "SELECT tp.id
             FROM test_plans tp
             JOIN projects p ON p.id = tp.project_id
             WHERE tp.name = ?1 AND p.name = ?2
             ORDER BY tp.id LIMIT 1",
            [row.plan.as_str(), row.project.as_str()],
            |r| r.get(0),
        )
        .map_err(|_| "Plan not found".to_string())?
    };

    let tx = conn.unchecked_transaction().map_err(|e| e.to_string())?;

    let existing = tx.query_row(
        "SELECT id FROM test_cases WHERE test_case_id = ?1 LIMIT 1",
        [row.case_id.as_str()],
        |r| r.get::<_, i64>(0),
    );
    let case_db_id = match existing {
        Ok(id) => id,
        Err(_) => {
            tx.execute(
                "INSERT INTO test_cases (
                    test_case_id, title, case_type, related_feature, priority,
                    preconditions, steps, test_data, expected_result,
                    actual_result, status, bug_id_or_comments, notes
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
                [
                    row.case_id.as_str(),
                    row.title.as_str(),
                    row.case_type.as_str(),
                    row.modules.as_str(),
                    row.priority.as_str(),
                    row.preconditions.as_str(),
                    row.steps.as_str(),
                    row.test_data.as_str(),
                    row.expected.as_str(),
                    row.actual.as_str(),
                    row.status.as_str(),
                    row.bug_comment.as_str(),
                    row.notes.as_str(),
                ],
            )
            .map_err(|e| e.to_string())?;
            tx.last_insert_rowid()
        }
    };

    tx.execute(
        "INSERT OR IGNORE INTO plan_case_links (plan_id, case_id) VALUES (?1, ?2)",
        [plan_id.to_string(), case_db_id.to_string()],
    )
    .map_err(|e| e.to_string())?;
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

fn parse_import_rows(bytes: Vec<u8>) -> Result<Vec<ImportRow>, String> {
    let cursor = Cursor::new(bytes);
    let mut workbook = Xlsx::new(cursor).map_err(|e| e.to_string())?;
    let range = workbook
        .worksheet_range("Import Test Cases")
        .map_err(|e| e.to_string())?;

    let mut rows = Vec::new();
    for (index, row) in range.rows().enumerate() {
        if index == 0 {
            continue;
        }
        let parsed = ImportRow {
            row_number: index + 1,
            project: data_to_string(row.get(0)),
            plan: data_to_string(row.get(1)),
            case_id: data_to_string(row.get(2)),
            title: data_to_string(row.get(3)),
            case_type: data_to_string(row.get(4)),
            modules: data_to_string(row.get(5)),
            priority: data_to_string(row.get(6)),
            status: data_to_string(row.get(7)),
            preconditions: data_to_string(row.get(8)),
            steps: data_to_string(row.get(9)),
            test_data: data_to_string(row.get(10)),
            expected: data_to_string(row.get(11)),
            actual: data_to_string(row.get(12)),
            bug_comment: data_to_string(row.get(13)),
            notes: data_to_string(row.get(14)),
        };

        let has_data = !parsed.project.is_empty()
            || !parsed.plan.is_empty()
            || !parsed.case_id.is_empty()
            || !parsed.title.is_empty();
        if has_data {
            rows.push(parsed);
        }
    }
    Ok(rows)
}

#[tauri::command]
pub fn export_excel_report(app: AppHandle) -> Result<String, String> {
    let conn = open_connection(&app)?;
    let mut workbook = Workbook::new();
    export_plans_sheet(&conn, &mut workbook)?;
    export_cases_sheet(&conn, &mut workbook)?;
    export_results_sheet(&conn, &mut workbook)?;
    export_plan_case_mapping_sheet(&conn, &mut workbook)?;

    let path = choose_save_path(
        &format!("tester-desk-export-{}.xlsx", timestamp()),
        "Excel Workbook",
        &["xlsx"],
    )?;
    workbook.save(&path).map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn download_import_template(_app: AppHandle) -> Result<String, String> {
    let mut workbook = Workbook::new();
    export_import_template_sheet(&mut workbook)?;

    let path = choose_save_path(
        "tester-desk-import-template.xlsx",
        "Excel Workbook",
        &["xlsx"],
    )?;
    workbook.save(&path).map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn import_test_cases_from_template(
    app: AppHandle,
    file_bytes: Vec<u8>,
    skip_invalid: bool,
) -> Result<ImportSummary, String> {
    let conn = open_connection(&app)?;
    let rows = parse_import_rows(file_bytes)?;
    let total_rows = rows.len();
    let mut success_rows = 0usize;
    let mut failures: Vec<ImportFailure> = Vec::new();

    let mut valid_rows: Vec<&ImportRow> = Vec::new();
    for row in &rows {
        if let Err(reason) = validate_import_row(&conn, row) {
            failures.push(ImportFailure {
                row_number: row.row_number,
                reason,
            });
        } else {
            valid_rows.push(row);
        }
    }

    if !skip_invalid && !failures.is_empty() {
        return Ok(ImportSummary {
            total_rows,
            success_rows: valid_rows.len(),
            failed_rows: failures.len(),
            failures,
            requires_decision: true,
        });
    }

    for row in valid_rows {
        if let Err(reason) = import_one_row(&conn, row) {
            failures.push(ImportFailure {
                row_number: row.row_number,
                reason,
            });
        } else {
            success_rows += 1;
        }
    }

    Ok(ImportSummary {
        total_rows,
        success_rows,
        failed_rows: failures.len(),
        failures,
        requires_decision: false,
    })
}

fn csv_escape(value: String) -> String {
    let escaped = value.replace('"', "\"\"");
    format!("\"{}\"", escaped)
}

fn write_csv(conn: &Connection, path: PathBuf, sql: &str, headers: &[&str]) -> Result<(), String> {
    let mut output = String::new();
    output.push_str(&headers.iter().map(|item| csv_escape((*item).to_string())).collect::<Vec<_>>().join(","));
    output.push('\n');

    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;
    let column_count = stmt.column_count();
    let mut rows = stmt.query([]).map_err(|e| e.to_string())?;
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let mut cells = Vec::with_capacity(column_count);
        for index in 0..column_count {
            let value = row.get::<_, String>(index).unwrap_or_default();
            cells.push(csv_escape(value));
        }
        output.push_str(&cells.join(","));
        output.push('\n');
    }

    fs::write(path, output).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn export_power_bi_dataset(app: AppHandle) -> Result<String, String> {
    let conn = open_connection(&app)?;
    let mut dir = export_dir(&app)?;
    dir.push(format!("power-bi-dataset-{}", timestamp()));
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    write_csv(
        &conn,
        dir.join("test_plans.csv"),
        "SELECT CAST(id AS TEXT), CAST(project_id AS TEXT), name, testing_goal, scope_in, scope_out, tester_name, start_date, end_date, test_environment, risks_notes, created_at FROM test_plans",
        &["id", "project_id", "name", "testing_goal", "scope_in", "scope_out", "tester_name", "start_date", "end_date", "test_environment", "risks_notes", "created_at"],
    )?;
    write_csv(
        &conn,
        dir.join("test_cases.csv"),
        "SELECT CAST(id AS TEXT), test_case_id, title, case_type, related_feature, priority, status, preconditions, steps, test_data, expected_result, actual_result, bug_id_or_comments, notes, created_at FROM test_cases",
        &["id", "test_case_id", "title", "case_type", "related_feature", "priority", "status", "preconditions", "steps", "test_data", "expected_result", "actual_result", "bug_id_or_comments", "notes", "created_at"],
    )?;
    write_csv(
        &conn,
        dir.join("test_results.csv"),
        "SELECT CAST(id AS TEXT), CAST(case_id AS TEXT), COALESCE(CAST(plan_id AS TEXT), ''), result_status, tested_by, environment, tested_device, actual_result, bug_id_or_comments, executed_at FROM test_results",
        &["id", "case_id", "plan_id", "result_status", "tested_by", "environment", "tested_device", "actual_result", "bug_id_or_comments", "executed_at"],
    )?;
    write_csv(
        &conn,
        dir.join("plan_case_links.csv"),
        "SELECT CAST(plan_id AS TEXT), CAST(case_id AS TEXT), created_at FROM plan_case_links",
        &["plan_id", "case_id", "created_at"],
    )?;

    let pbids_path = dir.join("tester-desk.pbids");
    let escaped_path = dir.to_string_lossy().replace('\\', "\\\\");
    fs::write(
        &pbids_path,
        format!(
            "{{\n  \"version\": \"0.1\",\n  \"connections\": [{{\n    \"details\": {{\n      \"protocol\": \"folder\",\n      \"address\": {{ \"path\": \"{}\" }}\n    }},\n    \"options\": {{}},\n    \"mode\": \"Import\"\n  }}]\n}}\n",
            escaped_path
        ),
    )
    .map_err(|e| e.to_string())?;

    Ok(pbids_path.to_string_lossy().to_string())
}
