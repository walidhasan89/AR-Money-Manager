# Backup & Data Portability Strategy

## Principles

Data must never be easily lost. Three independent safety nets:

1. **Transactional writes.** Every create/update/delete is a committed SQLite transaction at the moment it happens — nothing sits unsaved in memory.
2. **Manual backup, always available.** One click/shortcut copies the full SQLite file (with a timestamped filename) to a user-chosen folder.
3. **Automatic pre-migration and pre-restore safety copies.** Before any schema migration runs, and before any restore operation overwrites the live DB, the app silently copies the current DB to a local `backups/auto/` folder first (in addition to any manual backups), so a bad restore or migration is always reversible.

## Manual backup

- Triggered from Settings → Backup, or `Ctrl+B`.
- Copies the live SQLite file to a user-chosen location via native save dialog.
- Filename pattern: `finance-backup-YYYY-MM-DD-HHmm.sqlite`.
- Logged in `backups_log` table (path + timestamp) so Settings can show "last backup: 2 days ago."
- The dashboard/Settings surfaces a gentle reminder if the last backup is older than 14 days (no nagging modal — a small, dismissible indicator).

## Restore

- User picks a `.sqlite` backup file via native open dialog.
- App takes an automatic safety copy of the *current* DB first.
- Confirmation dialog clearly states this will replace all current data, and shows what will be restored (file name, date).
- On success, app restarts its DB connection against the restored file.

## CSV export/import

- Export: any list view (expenses, income, savings) can export the currently filtered rows to CSV.
- Import: CSV import is a Post-MVP nice-to-have for migrating from a spreadsheet; requires a column-mapping step and a dry-run preview before committing rows — never imports blind.

## What is explicitly out of scope for MVP

- Cloud backup (Google Drive/Dropbox API integration) — user can achieve this manually by pointing the DB file location (Settings) at a folder they already sync themselves.
- Automatic scheduled backups on a timer — deferred until there's evidence manual + reminder isn't enough.
- Encryption at rest — the DB file is not encrypted in MVP; noted as a risk in `ROADMAP.md` and revisit if the app is ever used for more sensitive data than personal budgeting.
