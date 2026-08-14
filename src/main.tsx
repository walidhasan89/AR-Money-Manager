import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import { App } from './App'
import { getDb } from './lib/db/connection'
import { checkPreMigrationBackup } from './lib/ipc/commands'

const root = createRoot(document.getElementById('root')!)

// A safety copy is taken first if this run is about to apply a migration
// the existing DB file hasn't seen yet (docs/architecture/BACKUP_STRATEGY.md).
// This must resolve before Database.load() below, since that call is what
// actually runs the migration.
//
// The app tree isn't rendered until both steps settle. Every screen fires
// its own typed IPC command the instant it mounts, and those commands read
// the pool tauri-plugin-sql registers only once Database.load() completes
// on the Rust side — rendering immediately (the previous behavior) let
// Dashboard's first effects race ahead of that registration and fail with
// "database connection not initialized yet" on a cold start.
checkPreMigrationBackup()
  .catch(() => false)
  .finally(() =>
    getDb()
      .catch((error) => {
        console.error('Failed to open the database', error)
      })
      .finally(() => {
        root.render(
          <StrictMode>
            <App />
          </StrictMode>,
        )
      }),
  )
