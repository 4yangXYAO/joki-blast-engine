#!/usr/bin/env ts-node
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

// Initialize SQLite database with WAL mode and run migrations
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.resolve(ROOT, 'data');
const DB_PATH = path.resolve(DATA_DIR, 'app.db');
const MIGRATIONS_DIR = path.resolve(ROOT, 'migrations');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function main() {
  ensureDir(DATA_DIR);
  // Open or create DB
  const db = new (Database as any)(DB_PATH);
  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');

  // Apply all migrations in order
  if (fs.existsSync(MIGRATIONS_DIR)) {
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();
    for (const file of files) {
      const full = path.resolve(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(full, 'utf8');
      try {
        db.exec(sql);
        console.log(`Applied migration: ${file}`);
      } catch (err) {
        console.error(`Failed to apply migration ${file}:`, err);
        throw err;
      }
    }
  } else {
    console.warn('Migrations directory not found, skipping migrations.');
  }

  db.close();
  console.log('DB initialization complete.');
}

main().catch((err) => {
  console.error('DB init failed:', err);
  process.exit(1);
});
