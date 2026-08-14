import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import { App } from './App'
import { getDb } from './lib/db/connection'
import { checkPreMigrationBackup } from './lib/ipc/commands'

// A safety copy is taken first if this run is about to apply a migration
// the existing DB file hasn't seen yet (docs/architecture/BACKUP_STRATEGY.md).
// This must resolve before Database.load() below, since that call is what
// actually runs the migration.
checkPreMigrationBackup()
  .catch(() => false)
  .finally(() => {
    // Opens (and migrates, on first run) the SQLite connection as soon as
    // the app starts, so the DB file + seeded categories exist before any
    // screen needs them.
    getDb().catch((error) => {
      console.error('Failed to open the database', error)
    })
  })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
