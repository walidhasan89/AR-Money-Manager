# Phase 7 — Backup & Data Portability

## Objective
Implement the full backup/restore and CSV import/export strategy per `docs/architecture/BACKUP_STRATEGY.md`.

## Features / Tasks
- Manual backup (native save dialog, timestamped filename, logged in `backups_log`).
- Restore (native open dialog, pre-restore safety copy, confirmation dialog, DB reconnect on success).
- Backup screen: last-backup indicator, stale-backup reminder.
- CSV import (Post-MVP-leaning but scoped here if time allows): column mapping + dry-run preview before commit.
- Automatic pre-migration safety copy hook (wired into the migration runner from Phase 1).

## Dependencies
Phase 1 (migration runner) and general data model stable.

## Expected output
Confidence that data can never be easily lost — every risky operation has a safety net.

## Testing requirements
- Backup produces a valid, row-count-matching SQLite file.
- Restore correctly swaps the live DB and creates a safety copy first.
- Restoring an invalid/corrupt file fails gracefully without touching live data.

## Definition of Done
- [ ] Backup and restore both work end-to-end with real data.
- [ ] Pre-restore and pre-migration safety copies are created automatically and are themselves restorable.
- [ ] Stale-backup reminder appears/disappears correctly based on `backups_log`.
