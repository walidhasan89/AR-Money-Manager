import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import { App } from './App'
import { getDb } from './lib/db/connection'

// Opens (and migrates, on first run) the SQLite connection as soon as the
// app starts, so the DB file + seeded categories exist before any screen
// needs them.
getDb().catch((error) => {
  console.error('Failed to open the database', error)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
