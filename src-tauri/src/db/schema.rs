use rusqlite::{params, Connection};

pub fn table_has_column(conn: &Connection, table: &str, column: &str) -> Result<bool, String> {
    let mut stmt = conn
        .prepare(&format!("PRAGMA table_info({table})"))
        .map_err(|e| e.to_string())?;

    let mut rows = stmt.query([]).map_err(|e| e.to_string())?;
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let column_name: String = row.get(1).map_err(|e| e.to_string())?;
        if column_name == column {
            return Ok(true);
        }
    }
    Ok(false)
}

pub fn ensure_column(
    conn: &Connection,
    table: &str,
    column: &str,
    sql_def: &str,
) -> Result<(), String> {
    if table_has_column(conn, table, column)? {
        return Ok(());
    }
    conn.execute(
        &format!("ALTER TABLE {table} ADD COLUMN {column} {sql_def}"),
        params![],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn ensure_default_project(conn: &Connection) -> Result<i64, String> {
    let existing_id = conn
        .query_row(
            "SELECT id FROM projects WHERE name = 'Default Project' ORDER BY id LIMIT 1",
            [],
            |row| row.get::<_, i64>(0),
        )
        .ok();

    if let Some(id) = existing_id {
        return Ok(id);
    }

    conn.execute(
        "INSERT INTO projects (name, description) VALUES ('Default Project', 'Auto-created project for existing test plans')",
        params![],
    )
    .map_err(|e| e.to_string())?;

    Ok(conn.last_insert_rowid())
}

pub fn ensure_default_named_options(
    conn: &Connection,
    table: &str,
    defaults: &[&str],
) -> Result<(), String> {
    let mut count_stmt = conn
        .prepare(&format!("SELECT COUNT(*) FROM {table}"))
        .map_err(|e| e.to_string())?;
    let count: i64 = count_stmt
        .query_row([], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    if count > 0 {
        return Ok(());
    }

    for item in defaults {
        conn.execute(
            &format!("INSERT INTO {table} (name) VALUES (?1)"),
            params![item],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub fn init_schema(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS test_plans (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER,
          name TEXT NOT NULL,
          feature_module TEXT NOT NULL DEFAULT '',
          testing_goal TEXT NOT NULL DEFAULT '',
          scope_in TEXT NOT NULL DEFAULT '',
          scope_out TEXT NOT NULL DEFAULT '',
          tester_name TEXT NOT NULL DEFAULT '',
          start_date TEXT NOT NULL DEFAULT '',
          end_date TEXT NOT NULL DEFAULT '',
          test_environment TEXT NOT NULL DEFAULT '',
          risks_notes TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS test_cases (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          test_case_id TEXT NOT NULL DEFAULT '',
          title TEXT NOT NULL,
          case_type TEXT NOT NULL DEFAULT 'functional',
          related_feature TEXT NOT NULL DEFAULT '',
          priority TEXT NOT NULL DEFAULT 'medium',
          preconditions TEXT NOT NULL DEFAULT '',
          steps TEXT NOT NULL DEFAULT '',
          test_data TEXT NOT NULL DEFAULT '',
          expected_result TEXT NOT NULL DEFAULT '',
          actual_result TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'not-run',
          bug_id_or_comments TEXT NOT NULL DEFAULT '',
          notes TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS plan_case_links (
          plan_id INTEGER NOT NULL,
          case_id INTEGER NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          PRIMARY KEY (plan_id, case_id),
          FOREIGN KEY (plan_id) REFERENCES test_plans(id) ON DELETE CASCADE,
          FOREIGN KEY (case_id) REFERENCES test_cases(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS checklist_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          plan_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          done INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (plan_id) REFERENCES test_plans(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS test_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          case_id INTEGER NOT NULL,
          plan_id INTEGER,
          result_status TEXT NOT NULL,
          tested_by TEXT NOT NULL DEFAULT '',
          environment TEXT NOT NULL DEFAULT '',
          tested_device TEXT NOT NULL DEFAULT '',
          actual_result TEXT NOT NULL DEFAULT '',
          bug_id_or_comments TEXT NOT NULL DEFAULT '',
          attachments TEXT NOT NULL DEFAULT '[]',
          executed_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (case_id) REFERENCES test_cases(id) ON DELETE CASCADE,
          FOREIGN KEY (plan_id) REFERENCES test_plans(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS environment_options (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS device_options (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS project_modules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          UNIQUE(project_id, name),
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS case_module_links (
          case_id INTEGER NOT NULL,
          module_id INTEGER NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          PRIMARY KEY (case_id, module_id),
          FOREIGN KEY (case_id) REFERENCES test_cases(id) ON DELETE CASCADE,
          FOREIGN KEY (module_id) REFERENCES project_modules(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
        "#,
    )
    .map_err(|e| e.to_string())?;

    // Seed default settings
    conn.execute(
        "INSERT OR IGNORE INTO app_settings (key, value) VALUES ('test_case_id_prefix', 'TC')",
        params![],
    )
    .map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR IGNORE INTO app_settings (key, value) VALUES ('test_case_id_separator', '-')",
        params![],
    )
    .map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR IGNORE INTO app_settings (key, value) VALUES ('test_case_id_padding', '4')",
        params![],
    )
    .map_err(|e| e.to_string())?;

    // Migrations: add missing columns
    ensure_column(conn, "test_plans", "project_id", "INTEGER")?;
    ensure_column(conn, "test_plans", "feature_module", "TEXT NOT NULL DEFAULT ''")?;
    ensure_column(conn, "test_plans", "testing_goal", "TEXT NOT NULL DEFAULT ''")?;
    ensure_column(conn, "test_plans", "scope_in", "TEXT NOT NULL DEFAULT ''")?;
    ensure_column(conn, "test_plans", "scope_out", "TEXT NOT NULL DEFAULT ''")?;
    ensure_column(conn, "test_plans", "tester_name", "TEXT NOT NULL DEFAULT ''")?;
    ensure_column(conn, "test_plans", "start_date", "TEXT NOT NULL DEFAULT ''")?;
    ensure_column(conn, "test_plans", "end_date", "TEXT NOT NULL DEFAULT ''")?;
    ensure_column(conn, "test_plans", "test_environment", "TEXT NOT NULL DEFAULT ''")?;
    ensure_column(conn, "test_plans", "risks_notes", "TEXT NOT NULL DEFAULT ''")?;

    ensure_column(conn, "test_cases", "test_case_id", "TEXT NOT NULL DEFAULT ''")?;
    ensure_column(conn, "test_cases", "case_type", "TEXT NOT NULL DEFAULT 'functional'")?;
    ensure_column(conn, "test_cases", "related_feature", "TEXT NOT NULL DEFAULT ''")?;
    ensure_column(conn, "test_cases", "preconditions", "TEXT NOT NULL DEFAULT ''")?;
    ensure_column(conn, "test_cases", "test_data", "TEXT NOT NULL DEFAULT ''")?;
    ensure_column(conn, "test_cases", "actual_result", "TEXT NOT NULL DEFAULT ''")?;
    ensure_column(conn, "test_cases", "status", "TEXT NOT NULL DEFAULT 'not-run'")?;
    ensure_column(conn, "test_cases", "bug_id_or_comments", "TEXT NOT NULL DEFAULT ''")?;
    ensure_column(conn, "test_cases", "notes", "TEXT NOT NULL DEFAULT ''")?;

    ensure_column(conn, "test_results", "bug_id_or_comments", "TEXT NOT NULL DEFAULT ''")?;
    ensure_column(conn, "test_results", "tested_device", "TEXT NOT NULL DEFAULT ''")?;
    ensure_column(conn, "test_results", "attachments", "TEXT NOT NULL DEFAULT '[]'")?;

    // Migrate old attachment_1/2/3 into attachments JSON array
    let has_old_cols: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM pragma_table_info('test_results') WHERE name = 'attachment_1'",
            [],
            |row| row.get::<_, i64>(0),
        )
        .unwrap_or(0) > 0;
    if has_old_cols {
        let mut stmt = conn.prepare(
            "SELECT id, attachment_1, attachment_2, attachment_3 FROM test_results WHERE attachment_1 != '' OR attachment_2 != '' OR attachment_3 != ''"
        ).map_err(|e| e.to_string())?;
        let rows: Vec<(i64, String, String, String)> = stmt.query_map([], |row| {
            Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?))
        }).map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();
        for (id, a1, a2, a3) in rows {
            let arr: Vec<&str> = [a1.as_str(), a2.as_str(), a3.as_str()]
                .into_iter()
                .filter(|s| !s.is_empty())
                .collect();
            let json = serde_json::to_string(&arr).unwrap_or_else(|_| "[]".to_string());
            conn.execute(
                "UPDATE test_results SET attachments = ?1 WHERE id = ?2",
                rusqlite::params![json, id],
            ).map_err(|e| e.to_string())?;
        }
    }

    // Data migrations from old column names
    if table_has_column(conn, "test_plans", "owner")? {
        conn.execute(
            "UPDATE test_plans SET tester_name = owner WHERE trim(tester_name) = ''",
            params![],
        )
        .map_err(|e| e.to_string())?;
    }
    if table_has_column(conn, "test_plans", "schedule")? {
        conn.execute(
            "UPDATE test_plans SET test_environment = schedule WHERE trim(test_environment) = ''",
            params![],
        )
        .map_err(|e| e.to_string())?;
    }
    if table_has_column(conn, "test_plans", "scope")? {
        conn.execute(
            "UPDATE test_plans SET scope_in = scope WHERE trim(scope_in) = ''",
            params![],
        )
        .map_err(|e| e.to_string())?;
    }
    if table_has_column(conn, "test_cases", "case_type")? {
        conn.execute(
            "UPDATE test_cases SET case_type = 'functional' WHERE trim(case_type) = ''",
            params![],
        )
        .map_err(|e| e.to_string())?;
        conn.execute(
            "UPDATE test_cases SET related_feature = case_type WHERE trim(related_feature) = ''",
            params![],
        )
        .map_err(|e| e.to_string())?;
    }
    if table_has_column(conn, "test_results", "notes")? {
        conn.execute(
            "UPDATE test_results SET bug_id_or_comments = notes WHERE trim(bug_id_or_comments) = ''",
            params![],
        )
        .map_err(|e| e.to_string())?;
    }

    // Backfill test_case_id
    conn.execute(
        "UPDATE test_cases SET test_case_id = 'TC-' || id WHERE trim(test_case_id) = ''",
        params![],
    )
    .map_err(|e| e.to_string())?;

    // Seed next_number based on max existing id
    let max_case_id: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(id), 0) FROM test_cases",
            params![],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;
    let initial_next = (max_case_id + 1).max(1);
    conn.execute(
        "INSERT OR IGNORE INTO app_settings (key, value) VALUES ('test_case_id_next_number', ?1)",
        params![initial_next.to_string()],
    )
    .map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE app_settings SET value = ?1
         WHERE key = 'test_case_id_next_number'
           AND (trim(value) = '' OR CAST(value AS INTEGER) < 1)",
        params![initial_next.to_string()],
    )
    .map_err(|e| e.to_string())?;

    // Seed default named options
    ensure_default_named_options(
        conn,
        "environment_options",
        &["Local", "QA", "Staging", "Production"],
    )?;
    ensure_default_named_options(
        conn,
        "device_options",
        &[
            "Desktop (Windows)",
            "Desktop (macOS)",
            "Smartphone (Android)",
            "Smartphone (iOS)",
        ],
    )?;

    // Import existing environment/device values from historical data
    conn.execute(
        "INSERT OR IGNORE INTO environment_options (name)
         SELECT DISTINCT trim(test_environment) FROM test_plans WHERE trim(test_environment) <> ''",
        params![],
    )
    .map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR IGNORE INTO environment_options (name)
         SELECT DISTINCT trim(environment) FROM test_results WHERE trim(environment) <> ''",
        params![],
    )
    .map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR IGNORE INTO device_options (name)
         SELECT DISTINCT trim(tested_device) FROM test_results WHERE trim(tested_device) <> ''",
        params![],
    )
    .map_err(|e| e.to_string())?;

    // Assign orphan plans to default project
    let default_project_id = ensure_default_project(conn)?;
    conn.execute(
        "UPDATE test_plans SET project_id = ?1 WHERE project_id IS NULL",
        params![default_project_id],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT OR IGNORE INTO project_modules (project_id, name)
         SELECT DISTINCT COALESCE(tp.project_id, ?1), trim(tc.related_feature)
         FROM test_cases tc
         LEFT JOIN plan_case_links pcl ON pcl.case_id = tc.id
         LEFT JOIN test_plans tp ON tp.id = pcl.plan_id
         WHERE trim(tc.related_feature) <> ''",
        params![default_project_id],
    )
    .map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR IGNORE INTO case_module_links (case_id, module_id)
         SELECT DISTINCT tc.id, pm.id
         FROM test_cases tc
         LEFT JOIN plan_case_links pcl ON pcl.case_id = tc.id
         LEFT JOIN test_plans tp ON tp.id = pcl.plan_id
         JOIN project_modules pm
           ON pm.project_id = COALESCE(tp.project_id, ?1)
          AND lower(pm.name) = lower(trim(tc.related_feature))
         WHERE trim(tc.related_feature) <> ''",
        params![default_project_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}
