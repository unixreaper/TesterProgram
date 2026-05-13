use rusqlite::{params, Connection};

use crate::models::{TestCaseIdSettings, UpdateTestCaseIdSettingsInput};

pub fn get_app_setting(conn: &Connection, key: &str) -> Result<Option<String>, String> {
    use rusqlite::OptionalExtension;
    conn.query_row(
        "SELECT value FROM app_settings WHERE key = ?1",
        params![key],
        |row| row.get::<_, String>(0),
    )
    .optional()
    .map_err(|e| e.to_string())
}

pub fn set_app_setting(conn: &Connection, key: &str, value: &str) -> Result<(), String> {
    conn.execute(
        "INSERT INTO app_settings (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        params![key, value],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn format_test_case_id(
    prefix: &str,
    separator: &str,
    padding: i64,
    next_number: i64,
) -> String {
    let safe_padding = padding.clamp(1, 12) as usize;
    let safe_next = next_number.max(1);
    let number = format!("{safe_next:0safe_padding$}");
    if prefix.is_empty() {
        number
    } else {
        format!("{prefix}{separator}{number}")
    }
}

pub fn read_test_case_id_settings(conn: &Connection) -> Result<TestCaseIdSettings, String> {
    let prefix =
        get_app_setting(conn, "test_case_id_prefix")?.unwrap_or_else(|| "TC".to_string());
    let separator =
        get_app_setting(conn, "test_case_id_separator")?.unwrap_or_else(|| "-".to_string());
    let padding = get_app_setting(conn, "test_case_id_padding")?
        .and_then(|v| v.parse::<i64>().ok())
        .unwrap_or(4)
        .clamp(1, 12);
    let next_number = get_app_setting(conn, "test_case_id_next_number")?
        .and_then(|v| v.parse::<i64>().ok())
        .unwrap_or(1)
        .max(1);

    let preview = format_test_case_id(&prefix, &separator, padding, next_number);
    Ok(TestCaseIdSettings {
        prefix,
        separator,
        padding,
        next_number,
        preview,
    })
}

pub fn save_test_case_id_settings(
    conn: &Connection,
    input: &UpdateTestCaseIdSettingsInput,
) -> Result<TestCaseIdSettings, String> {
    let prefix = input.prefix.trim().to_string();
    let separator = input.separator.trim().to_string();
    let padding = input.padding.clamp(1, 12);
    let next_number = input.next_number.max(1);

    set_app_setting(conn, "test_case_id_prefix", &prefix)?;
    set_app_setting(conn, "test_case_id_separator", &separator)?;
    set_app_setting(conn, "test_case_id_padding", &padding.to_string())?;
    set_app_setting(conn, "test_case_id_next_number", &next_number.to_string())?;

    let preview = format_test_case_id(&prefix, &separator, padding, next_number);
    Ok(TestCaseIdSettings {
        prefix,
        separator,
        padding,
        next_number,
        preview,
    })
}

pub fn reserve_next_test_case_id_value(conn: &Connection) -> Result<String, String> {
    let settings = read_test_case_id_settings(conn)?;
    let reserved = format_test_case_id(
        &settings.prefix,
        &settings.separator,
        settings.padding,
        settings.next_number,
    );
    let upcoming = settings.next_number + 1;
    set_app_setting(conn, "test_case_id_next_number", &upcoming.to_string())?;
    Ok(reserved)
}
