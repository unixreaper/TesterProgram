use std::collections::HashMap;
use tauri::AppHandle;

use crate::db::open_connection;
use crate::models::{
    ChecklistItem, DashboardData, DeviceOption, EnvironmentOption, Project, ProjectModule, TestCase,
    TestPlan, TestResultRecord,
};

#[tauri::command]
pub fn load_dashboard_data(app: AppHandle) -> Result<DashboardData, String> {
    let conn = open_connection(&app)?;

    // Projects
    let mut stmt = conn
        .prepare("SELECT id, name, description, created_at FROM projects ORDER BY id DESC")
        .map_err(|e| e.to_string())?;
    let projects = stmt
        .query_map([], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                created_at: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, project_id, name, description, created_at
             FROM project_modules
             ORDER BY project_id ASC, lower(name) ASC",
        )
        .map_err(|e| e.to_string())?;
    let modules = stmt
        .query_map([], |row| {
            Ok(ProjectModule {
                id: row.get(0)?,
                project_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                created_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    // Plans
    let mut stmt = conn
        .prepare(
            "SELECT id, project_id, name, feature_module, testing_goal,
                    scope_in, scope_out, tester_name, start_date, end_date,
                    test_environment, risks_notes, created_at
             FROM test_plans ORDER BY id DESC",
        )
        .map_err(|e| e.to_string())?;
    let plans = stmt
        .query_map([], |row| {
            Ok(TestPlan {
                id: row.get(0)?,
                project_id: row.get(1)?,
                name: row.get(2)?,
                feature_module: row.get(3)?,
                testing_goal: row.get(4)?,
                scope_in: row.get(5)?,
                scope_out: row.get(6)?,
                tester_name: row.get(7)?,
                start_date: row.get(8)?,
                end_date: row.get(9)?,
                test_environment: row.get(10)?,
                risks_notes: row.get(11)?,
                created_at: row.get(12)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    // Plan-case link map (case_id → [plan_id])
    let mut link_stmt = conn
        .prepare("SELECT plan_id, case_id FROM plan_case_links")
        .map_err(|e| e.to_string())?;
    let mut link_rows = link_stmt.query([]).map_err(|e| e.to_string())?;
    let mut link_map: HashMap<i64, Vec<i64>> = HashMap::new();
    while let Some(row) = link_rows.next().map_err(|e| e.to_string())? {
        let plan_id: i64 = row.get(0).map_err(|e| e.to_string())?;
        let case_id: i64 = row.get(1).map_err(|e| e.to_string())?;
        link_map.entry(case_id).or_default().push(plan_id);
    }

    let mut module_link_stmt = conn
        .prepare(
            "SELECT cml.case_id, pm.id, pm.name
             FROM case_module_links cml
             JOIN project_modules pm ON pm.id = cml.module_id
             ORDER BY lower(pm.name)",
        )
        .map_err(|e| e.to_string())?;
    let mut module_rows = module_link_stmt.query([]).map_err(|e| e.to_string())?;
    let mut module_id_map: HashMap<i64, Vec<i64>> = HashMap::new();
    let mut module_name_map: HashMap<i64, Vec<String>> = HashMap::new();
    while let Some(row) = module_rows.next().map_err(|e| e.to_string())? {
        let case_id: i64 = row.get(0).map_err(|e| e.to_string())?;
        let module_id: i64 = row.get(1).map_err(|e| e.to_string())?;
        let module_name: String = row.get(2).map_err(|e| e.to_string())?;
        module_id_map.entry(case_id).or_default().push(module_id);
        module_name_map.entry(case_id).or_default().push(module_name);
    }

    // Cases
    let mut stmt = conn
        .prepare(
            "SELECT id, test_case_id, title, case_type, related_feature, priority,
                    preconditions, steps, test_data, expected_result, actual_result,
                    status, bug_id_or_comments, notes, created_at
             FROM test_cases ORDER BY id DESC",
        )
        .map_err(|e| e.to_string())?;
    let cases = stmt
        .query_map([], |row| {
            Ok(TestCase {
                id: row.get(0)?,
                test_case_id: row.get(1)?,
                title: row.get(2)?,
                case_type: row.get(3)?,
                related_feature: row.get(4)?,
                module_ids: vec![],
                module_names: vec![],
                priority: row.get(5)?,
                preconditions: row.get(6)?,
                steps: row.get(7)?,
                test_data: row.get(8)?,
                expected_result: row.get(9)?,
                actual_result: row.get(10)?,
                status: row.get(11)?,
                bug_id_or_comments: row.get(12)?,
                notes: row.get(13)?,
                linked_plan_ids: vec![], // filled below
                created_at: row.get(14)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    let cases = cases
        .into_iter()
        .map(|mut c| {
            c.linked_plan_ids = link_map.remove(&c.id).unwrap_or_default();
            c.module_ids = module_id_map.remove(&c.id).unwrap_or_default();
            c.module_names = module_name_map.remove(&c.id).unwrap_or_default();
            if !c.module_names.is_empty() {
                c.related_feature = c.module_names.join(", ");
            }
            c
        })
        .collect::<Vec<_>>();

    // Checklists
    let mut stmt = conn
        .prepare(
            "SELECT id, plan_id, title, done, created_at
             FROM checklist_items ORDER BY id DESC",
        )
        .map_err(|e| e.to_string())?;
    let checklists = stmt
        .query_map([], |row| {
            let done_num: i64 = row.get(3)?;
            Ok(ChecklistItem {
                id: row.get(0)?,
                plan_id: row.get(1)?,
                title: row.get(2)?,
                done: done_num == 1,
                created_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    // Test results (latest 500)
    let mut stmt = conn
        .prepare(
            "SELECT id, case_id, plan_id, result_status, tested_by,
                    environment, tested_device, actual_result,
                    bug_id_or_comments, attachments, executed_at
             FROM test_results
             ORDER BY datetime(executed_at) DESC, id DESC
             LIMIT 500",
        )
        .map_err(|e| e.to_string())?;
    let test_results = stmt
        .query_map([], |row| {
            let attachments_json: String = row.get(9)?;
            let attachments: Vec<String> = serde_json::from_str(&attachments_json).unwrap_or_default();
            Ok(TestResultRecord {
                id: row.get(0)?,
                case_id: row.get(1)?,
                plan_id: row.get(2)?,
                result_status: row.get(3)?,
                tested_by: row.get(4)?,
                environment: row.get(5)?,
                tested_device: row.get(6)?,
                actual_result: row.get(7)?,
                bug_id_or_comments: row.get(8)?,
                attachments,
                executed_at: row.get(10)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    // Environments
    let mut stmt = conn
        .prepare("SELECT id, name FROM environment_options ORDER BY lower(name)")
        .map_err(|e| e.to_string())?;
    let environments = stmt
        .query_map([], |row| Ok(EnvironmentOption { id: row.get(0)?, name: row.get(1)? }))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    // Devices
    let mut stmt = conn
        .prepare("SELECT id, name FROM device_options ORDER BY lower(name)")
        .map_err(|e| e.to_string())?;
    let devices = stmt
        .query_map([], |row| Ok(DeviceOption { id: row.get(0)?, name: row.get(1)? }))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(DashboardData {
        projects,
        modules,
        plans,
        cases,
        checklists,
        test_results,
        environments,
        devices,
    })
}
