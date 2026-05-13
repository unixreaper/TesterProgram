use tauri::Manager;

#[tauri::command]
pub async fn open_results_window(app: tauri::AppHandle) {
    let _ = tauri::WebviewWindowBuilder::new(
        &app,
        "results",
        tauri::WebviewUrl::App("index.html?window=results".into()),
    )
    .title("Test Results")
    .inner_size(900.0, 600.0)
    .build();
}

#[tauri::command]
pub async fn open_result_detail_window(app: tauri::AppHandle, result_id: i64) {
    let label = format!("result_detail_{}", result_id);
    let url = format!("index.html?window=result_detail&id={}", result_id);
    let _ = tauri::WebviewWindowBuilder::new(
        &app,
        &label,
        tauri::WebviewUrl::App(url.into()),
    )
    .title("Test Result Detail")
    .inner_size(560.0, 640.0)
    .build();
}

#[tauri::command]
pub async fn open_checklist_window(app: tauri::AppHandle) {
    let _ = tauri::WebviewWindowBuilder::new(
        &app,
        "checklist",
        tauri::WebviewUrl::App("index.html?window=checklist".into()),
    )
    .title("Checklist")
    .inner_size(400.0, 600.0)
    .build();
}

#[tauri::command]
pub async fn close_window(app: tauri::AppHandle, label: String) {
    if let Some(window) = app.get_webview_window(&label) {
        let _ = window.close();
    }
}

#[tauri::command]
pub async fn start_main_window_drag(app: tauri::AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "main window not found".to_string())?;

    window.start_dragging().map_err(|error| error.to_string())
}
