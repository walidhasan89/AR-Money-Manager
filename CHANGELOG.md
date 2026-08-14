# Changelog

All notable changes to this project are documented here, following [Keep a Changelog](https://keepachangelog.com/) conventions.

## [Unreleased]

### Added
- Initial project documentation set (Phase 0 — Product Planning): PRD, architecture, database schema, design system, roadmap, phase breakdowns, master prompt, and Claude Code instructions.
- Phase 1 — Technical Foundation: Tauri 2 + React 18 + TypeScript (strict) app shell, wired end to end.
  - Vite + React 18 + TypeScript strict scaffold with the `src/` structure from `ARCHITECTURE.md` (`app`, `features/*`, `components`, `lib/{db,ipc,format}`, `store`, `styles`).
  - Tailwind CSS v4 design tokens implementing `docs/ui-ux/DESIGN_SYSTEM.md` (glass surface, accent colors, radii, blur, reduced-motion and no-backdrop-filter fallbacks), dark/light `ThemeProvider` (dark default, persisted).
  - `tauri-plugin-sql` wired to SQLite with a migration runner; `001_init.sql` implements the full schema from `docs/database/SCHEMA.md` and seeds the default categories and settings.
  - App shell: left nav with all 8 feature routes (placeholder screens with designed empty states), themed top bar, base `GlassCard`, `SidebarNavItem`, `EmptyState`, `ThemeToggle` components.
  - Typed `lib/ipc` wrapper pattern with a working example command (`get_app_version`), demonstrated live in the Settings screen.
  - Tooling: ESLint (flat config) + Prettier + TypeScript strict + Vitest, all clean; Rust migration/constraint tests (`cargo test`, 7 passing) covering schema shape, seeded data, FK/UNIQUE/CHECK constraints.
  - Locked-down Tauri CSP, minimal SQL plugin capabilities, app identifier `com.arfinance.desktop`.

<!--
Template for future entries:

## [1.0.0] - YYYY-MM-DD
### Added
- ...
### Changed
- ...
### Fixed
- ...
### Removed
- ...
-->
