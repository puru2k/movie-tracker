use tauri_plugin_sql::{Migration, MigrationKind};

/// Read a UTF-8 text file from an absolute path chosen via the native dialog.
#[tauri::command]
fn read_text_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

/// Write UTF-8 text to an absolute path chosen via the native save dialog.
#[tauri::command]
fn write_text_file(path: String, contents: String) -> Result<(), String> {
    std::fs::write(&path, contents).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_movies_table",
            sql: "CREATE TABLE IF NOT EXISTS movies (
            tmdb_id      INTEGER PRIMARY KEY,
            title        TEXT NOT NULL,
            poster_path  TEXT,
            backdrop_path TEXT,
            release_date TEXT,
            overview     TEXT,
            runtime      INTEGER,
            genres       TEXT,
            cast_members TEXT,
            director     TEXT,
            status       TEXT NOT NULL DEFAULT 'to_watch',
            rating       INTEGER,
            watch_date   TEXT,
            created_at   TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
        );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add_notes_column",
            sql: "ALTER TABLE movies ADD COLUMN notes TEXT;",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "add_rewatch_count_column",
            sql: "ALTER TABLE movies ADD COLUMN rewatch_count INTEGER NOT NULL DEFAULT 0;",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "add_platform_column",
            sql: "ALTER TABLE movies ADD COLUMN platform TEXT;",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "add_tags_column",
            sql: "ALTER TABLE movies ADD COLUMN tags TEXT;",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
            description: "add_favorite_column",
            sql: "ALTER TABLE movies ADD COLUMN favorite INTEGER NOT NULL DEFAULT 0;",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 7,
            description: "add_watch_dates_column",
            sql: "ALTER TABLE movies ADD COLUMN watch_dates TEXT;",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 8,
            description: "seed_watch_dates_from_watch_date",
            sql: "UPDATE movies SET watch_dates = '[\"' || watch_date || '\"]' WHERE watch_date IS NOT NULL AND watch_date <> '' AND watch_dates IS NULL;",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 9,
            description: "add_review_column",
            sql: "ALTER TABLE movies ADD COLUMN review TEXT;",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 10,
            description: "add_spoiler_column",
            sql: "ALTER TABLE movies ADD COLUMN spoiler INTEGER NOT NULL DEFAULT 0;",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 11,
            description: "add_poster_cache_column",
            sql: "ALTER TABLE movies ADD COLUMN poster_cache TEXT;",
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:movietracker.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![read_text_file, write_text_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
