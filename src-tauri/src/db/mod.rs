pub mod schema;
pub mod settings;

use rusqlite::Connection;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

use schema::init_schema;

pub fn db_path(app: &AppHandle) -> Result<PathBuf, String> {
    let mut app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;
    app_dir.push("tester_desk.sqlite3");
    Ok(app_dir)
}

pub fn open_connection(app: &AppHandle) -> Result<Connection, String> {
    let path = db_path(app)?;
    let conn = Connection::open(path).map_err(|e| e.to_string())?;
    conn.execute_batch("PRAGMA foreign_keys = ON;")
        .map_err(|e| e.to_string())?;
    init_schema(&conn)?;
    Ok(conn)
}
