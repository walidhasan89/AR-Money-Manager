import Database from '@tauri-apps/plugin-sql'

const DB_URL = 'sqlite:pfm.db'

let dbPromise: Promise<Database> | null = null

/**
 * Lazily opens (and migrates, on first call) the app's single SQLite
 * connection. Callers never touch raw SQL — see lib/db query functions
 * added alongside each feature.
 */
export function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = Database.load(DB_URL)
  }
  return dbPromise
}
