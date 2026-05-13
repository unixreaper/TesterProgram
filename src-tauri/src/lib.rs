mod commands;
mod db;
mod models;

use commands::{
    cases::{
        create_test_case, delete_test_case, get_test_case_id_settings, reserve_next_test_case_id,
        set_case_plan_link, update_test_case, update_test_case_id_settings,
    },
    checklist::{create_checklist_item, set_checklist_done, update_checklist_item, delete_checklist_item},
    dashboard::load_dashboard_data,
    exports::{
        download_import_template, export_excel_report, export_power_bi_dataset,
        import_test_cases_from_template,
    },
    modules::{create_project_module, delete_project_module, update_project_module},
    options::{
        create_device_option, create_environment_option, delete_device_option,
        delete_environment_option, update_device_option, update_environment_option,
    },
    plans::{create_test_plan, delete_test_plan, update_test_plan},
    projects::{create_project, delete_project, update_project},
    results,
    windows::{close_window, open_checklist_window, open_results_window, open_result_detail_window, start_main_window_drag},
    files,
};
use db::db_path;
use tauri::{AppHandle, Emitter};

#[tauri::command]
fn initialize_db(app: AppHandle) -> Result<String, String> {
    let path = db_path(&app)?;
    let _ = db::open_connection(&app)?;
    Ok(path.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            initialize_db,
            load_dashboard_data,
            export_excel_report,
            export_power_bi_dataset,
            download_import_template,
            import_test_cases_from_template,
            // Projects
            create_project,
            update_project,
            delete_project,
            // Plans
            create_test_plan,
            update_test_plan,
            delete_test_plan,
            // Modules
            create_project_module,
            update_project_module,
            delete_project_module,
            // Cases
            create_test_case,
            update_test_case,
            delete_test_case,
            get_test_case_id_settings,
            update_test_case_id_settings,
            reserve_next_test_case_id,
            set_case_plan_link,
            // Checklist
            create_checklist_item,
            set_checklist_done,
            update_checklist_item,
            delete_checklist_item,
            // Results
            results::create_test_result,
            results::update_test_result,
            results::delete_test_result,
            // Options
            create_environment_option,
            update_environment_option,
            delete_environment_option,
            create_device_option,
            update_device_option,
            delete_device_option,
            // Windows
            open_results_window,
            open_result_detail_window,
            open_checklist_window,
            close_window,
            start_main_window_drag,
            // Files
            files::save_attachment,
            files::get_attachment_url,
            files::pick_file,
            files::read_attachment_base64,
            files::open_attachment,
            files::reveal_attachment,
            files::save_attachment_as,
            files::open_path,
            files::cleanup_orphaned_attachments,
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                if window.label() == "results" {
                    let _ = window.emit("results-window-closed", ());
                } else if window.label() == "checklist" {
                    let _ = window.emit("checklist-window-closed", ());
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
