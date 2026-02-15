pub mod models;
pub mod queries;

use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use std::path::PathBuf;

pub async fn init_database(app_data_dir: PathBuf) -> Result<SqlitePool, sqlx::Error> {
    // Ensure the app data directory exists
    std::fs::create_dir_all(&app_data_dir)?;

    let db_path = app_data_dir.join("ticketdoc.db");
    let db_url = format!("sqlite:{}?mode=rwc", db_path.display());

    // Create connection pool with WAL mode for better concurrency
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await?;

    // Enable WAL mode
    sqlx::query("PRAGMA journal_mode=WAL")
        .execute(&pool)
        .await?;

    // Run migrations
    run_migrations(&pool).await?;

    Ok(pool)
}

async fn run_migrations(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    // Read and execute the migration SQL file
    let migration_sql = include_str!("../../migrations/001_initial.sql");

    sqlx::raw_sql(migration_sql)
        .execute(pool)
        .await?;

    Ok(())
}
