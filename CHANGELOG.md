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
- Phase 3 — Budget System: overall and per-category monthly budgets with live budget-vs-actual and overspending warnings.
  - Rust: `get_budget_summary`/`set_overall_budget`/`set_category_budget`/`copy_last_month_budget` commands. Budget-vs-actual is computed entirely in SQL (per `ARCHITECTURE.md` — never summed client-side): a `LEFT JOIN` + correlated `SUM` against `expenses`, scoped to the month. Upserts use `category_id IS ?` (not `=`) because SQLite's `UNIQUE` constraint treats every `NULL` distinct, so `ON CONFLICT` can't be relied on for the overall-budget row.
  - `BudgetBar` component with warning (≥80%) / danger (≥100%) thresholds per `docs/phases/PHASE_3.md`, color-coded and always paired with an icon (color is never the only signal), with a pulse glow in the danger state.
  - Budgets screen: month selector, overall budget, per-category budget rows, "Copy last month" action.
  - Live updates with no manual refresh: a small Zustand event bus (`dataEventsStore`) is bumped by every expense create/update/delete/confirm call site; the Budgets screen refetches on that signal.
  - `lib/budget.ts` (`budgetStatus`, `budgetFillPercent`) with unit tests; 3 new Rust integration tests (aggregation correctness, upsert idempotency, copy-last-month), 24 Rust tests total.

### Fixed
- `ConfirmFixedExpenseModal` and `CategoryFormModal` were rendered as children of a `GlassCard`, whose `backdrop-filter` establishes a CSS containing block for `position: fixed` descendants — trapping both modals inside the card's own bounds instead of covering the viewport (found via manual exercise of the app, not caught by any automated test since jsdom doesn't apply real CSS layout). Both are now rendered as siblings after their `GlassCard`, matching every other modal in the app.
- Budgets screen: the per-row editable amount fields used a `key`-based remount to resync from fresh server data (deliberately, so live spend updates never clobber an in-progress edit — see `BudgetAmountField`'s docstring). Two related races, both found via manual exercise: (1) switching months changed the `key` one render before the new month's data had arrived, so the field remounted with the *previous* month's stale value; fixed by gating the whole budgets section on `summary.month === month`. (2) "Copy last month" updated `summary` without changing `key` at all, so the fields kept showing pre-copy values even though the bar labels (which read `summary` directly) were correct; fixed by awaiting the fresh summary and bumping a dedicated remount counter in the same tick.

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
