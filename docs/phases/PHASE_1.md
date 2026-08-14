# Phase 1 — Technical Foundation

## Objective
Stand up a running, empty Tauri + React + TypeScript app with the database layer, design tokens, and project tooling in place — no features yet, but every subsequent phase builds on this cleanly.

## Features / Tasks
- Scaffold Tauri 2 + React + TypeScript project.
- Configure Tailwind CSS with the design tokens from `docs/ui-ux/DESIGN_SYSTEM.md` (colors, blur, radii as CSS variables).
- Set up `tauri-plugin-sql`, wire up SQLite connection, implement migration runner with `001_init.sql` (schema from `docs/database/SCHEMA.md`).
- Set up ESLint, Prettier, TypeScript strict mode, Vitest.
- Implement app shell: routing, left nav (empty screens), theme provider (dark default), the base `GlassCard` component.
- Implement `lib/ipc` typed wrapper pattern with one working example command (e.g., `ping` or `get_app_version`).
- Set up GitHub repo structure, `.gitignore`, initial commit conventions per `docs/development/DEVELOPMENT.md`.

## Dependencies
Phase 0 accepted.

## Expected output
App launches to an empty (but themed, glass-styled) dashboard shell with working nav between placeholder screens. Fresh SQLite DB created on first run with seeded categories.

## Testing requirements
- Migration test: fresh DB gets correct schema.
- Smoke test: app builds and launches on Windows.

## Definition of Done
- [ ] `tauri dev` launches the app with no errors.
- [ ] Dark/light theme toggle works (even with empty screens).
- [ ] SQLite file created at the correct app-data path with seeded categories.
- [ ] Lint/format/test scripts all run clean.
