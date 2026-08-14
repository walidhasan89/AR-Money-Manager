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
- Phase 2 — Core Expense & Income Tracking: the daily-use core, IPC end to end.
  - Rust: custom typed commands (no raw SQL ever crosses IPC) for categories, expenses, income, and fixed-expense templates, all backed by a shared connection pool reused from `tauri-plugin-sql`'s already-open database.
  - Expense/income CRUD with soft delete; combinable filters (date range, category, amount range, keyword) via `sqlx::QueryBuilder`; CSV export (via `tauri-plugin-dialog` + the `csv` crate) to a user-picked path only.
  - Fixed (recurring) expense templates with a pending-confirmation flow: `list_pending_fixed_expenses` computes what's due for a month, `confirm_fixed_expense` posts a real expense linked via `fixed_expense_id`, `skip_fixed_expense` records a dismissal without posting one.
  - Migrations `002_category_archive.sql` (category archiving) and `003_fixed_expense_skips.sql` (skip tracking), documented in `docs/database/SCHEMA.md` first.
  - Frontend: Quick Add Expense modal (`Ctrl+E`, ≤150ms animation budget, defaults to last-used category), Add Income modal (`Ctrl+I`), full Expenses screen (table, filters, CSV export, Fixed Expenses tab), Income screen, category management in Settings (add/edit/archive), and a pending-fixed-expenses widget on the Dashboard placeholder.
  - Shared components: `CategoryPicker`, `AmountInput`, `DateField`, `ConfirmDialog`, `EntryFilterBar`, toast notifications (Zustand-backed).
  - `formatCurrency`/`parseAmountToCents` in `lib/format`, with unit tests; 9 new Rust integration tests round-tripping every query module against a real temp SQLite DB (21 Rust tests total), plus a frontend smoke test.
  - New dependencies: `lucide-react` reused from Phase 1; `@hookform/resolvers` (glues the already-pinned React Hook Form + Zod together); `@tauri-apps/plugin-dialog` / `tauri-plugin-dialog` (native save dialog, required so CSV export only ever writes to a user-picked path); `sqlx`, `uuid`, `chrono`, `csv`, `thiserror` (Rust; typed queries, ID generation, due-date math, correct CSV escaping, structured errors).

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
