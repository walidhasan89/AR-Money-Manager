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

- Phase 4 — Dashboard: the real, animated glass dashboard, answering all six core money questions on load.
  - Rust: `get_dashboard_summary`/`get_savings_trend` commands, all aggregation done in SQL — income/expenses/savings totals, spend-by-category, a full daily-spending series for the month (zero-spend days included), and a 6-month trailing savings trend. `date_utils` extracted (`shift_month`/`days_in_month`) so Budgets and Dashboard share one month-arithmetic implementation.
  - Frontend: `KpiTile` (Income/Expenses/Savings/Remaining, Framer Motion count-up per `DESIGN_SYSTEM.md`), 4 Recharts cards (Spending by Category donut, Daily Spending bar, Savings Trend line with gradient fill — each with a glass-styled hover tooltip, draw-in animation, and a designed empty state) plus a Budget vs Actual card reusing Phase 3's `BudgetBar`, a Recent Transactions panel, and a slow ambient gradient-drift background.
  - Dashboard gets its own month selector (matching Budgets' pattern) and subscribes to the Phase 3 live-update event bus, so it refreshes with no manual reload after any expense/income mutation.
  - All dashboard animations (KPI count-up, card stagger-in, chart draw-in) explicitly check Framer Motion's `useReducedMotion()` — Recharts/Framer Motion animations run outside CSS, so the app-wide `prefers-reduced-motion` media query in `tokens.css` can't reach them on its own.
  - 2 new Rust integration tests (dashboard aggregation matches underlying data exactly, savings trend ordering), 26 Rust tests total.
- Phase 5 — Savings & Financial Goals: general savings, DPS, emergency fund, and custom goals with progress tracking.
  - Rust: `goals`/`savings_entries` CRUD commands (both tables already existed from the Phase 1 schema — no new migration needed). `list_goal_progress` computes each goal's `contributedCents` in one grouped SQL query (never summed client-side) and derives `progressPercent` (capped at 100%) and, for DPS goals, `projectedMaturityCents = monthlyContributionCents × tenureMonths`. `date_utils::months_between` added for the DPS tenure calculation.
  - Frontend: Savings screen — goal cards (glass, progress bar or raw total depending on whether a target is set, DPS-specific installment/maturity-date/projected-maturity rows), a "Log Savings" modal (ad-hoc or against a goal, with the entry's type auto-derived from the selected goal's type), a savings entries list with delete, and goal create/edit/archive.
  - Goals are archived (`is_active`), never hard-deleted, from the UI — matches the DoD's "archived, not hard-deleted if they have contributions."
  - The Dashboard's live-update event bus (`dataEventsStore`) gained a `savingsVersion` counter, bumped by savings create/delete, so the Dashboard's Savings KPI and trend chart refresh with no manual reload — same pattern Phase 3 established for expenses.
  - 5 new Rust integration tests (goal CRUD, contribution aggregation + 100% cap, DPS maturity projection against a known installment/tenure, a contribution updating both the goal's progress *and* the dashboard's Savings KPI in the same test, savings entry CRUD), plus 2 new `date_utils` unit tests; 33 Rust tests total.
- Phase 6 — Reports: a monthly summary report that can't drift from the Dashboard, plus a structured CSV export.
  - Rust: `get_report` builds its numbers by combining `dashboard::get_summary` and `budgets::get_summary` rather than re-querying — income/expenses/savings/net can never disagree with what the Dashboard shows for the same month. The category breakdown is sourced from the Dashboard's per-category spend query (not the budget-scoped one), so a category archived *after* it had spend still appears and the breakdown always sums exactly to the total.
  - CSV export is a structured summary (metric/value block, then the category table), not a raw row dump — `write_report_csv` writes to any `Write`, tested by round-tripping an in-memory buffer back through a CSV reader and asserting the parsed totals. Mixing a 2-column and a 3-column block in one CSV needed `WriterBuilder::flexible(true)` on both the writer and reader sides, since `csv::Writer` rejects inconsistent record lengths by default (not just `Reader`).
  - Frontend: Reports screen reuses Phase 4/5's `KpiTile` and `BudgetBar` components (Income/Expenses/Savings/Net tiles, an overall-budget-adherence bar), plus a new category breakdown table with a totals row, a month selector, and an "Export CSV" button via the native save dialog.
  - 3 new Rust integration tests (report numbers match dashboard exactly, breakdown sums to total including an archived-category-with-spend edge case, CSV round-trip contains the expected totals); 36 Rust tests total.

### Fixed
- `ConfirmFixedExpenseModal` and `CategoryFormModal` were rendered as children of a `GlassCard`, whose `backdrop-filter` establishes a CSS containing block for `position: fixed` descendants — trapping both modals inside the card's own bounds instead of covering the viewport (found via manual exercise of the app, not caught by any automated test since jsdom doesn't apply real CSS layout). Both are now rendered as siblings after their `GlassCard`, matching every other modal in the app.
- Budgets screen: the per-row editable amount fields used a `key`-based remount to resync from fresh server data (deliberately, so live spend updates never clobber an in-progress edit — see `BudgetAmountField`'s docstring). Two related races, both found via manual exercise: (1) switching months changed the `key` one render before the new month's data had arrived, so the field remounted with the *previous* month's stale value; fixed by gating the whole budgets section on `summary.month === month`. (2) "Copy last month" updated `summary` without changing `key` at all, so the fields kept showing pre-copy values even though the bar labels (which read `summary` directly) were correct; fixed by awaiting the fresh summary and bumping a dedicated remount counter in the same tick.
- Spending by Category donut: a center "Total spent" label was absolutely-positioned over the chart, and Recharts' hover tooltip floats near the cursor — hovering the top of the ring rendered both at once, producing garbled overlapping text (found via manual Xvfb exercise, not caught by any automated test). Removed the center label; the total is already shown in the Expenses KPI tile directly above, so nothing is lost.

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
