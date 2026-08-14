# UI/UX Guide — Screens & Flows

Visual language for all of this lives in `DESIGN_SYSTEM.md`. This doc defines structure and flow.

## Navigation (left rail)

Dashboard · Expenses · Income · Budgets · Savings & Goals · Reports · Backup · Settings

Global, always reachable: **Quick Add Expense** (`Ctrl+E`), theme toggle, current month selector (affects Dashboard/Reports scope).

## Screens

### Dashboard (home)
- 4 KPI glass tiles: Income, Expenses, Savings, Remaining (this month).
- Budget usage summary bar (overall % used, color-coded).
- 4 charts: spending by category, daily spending, budget vs actual, savings trend.
- Recent transactions list (last 5–10), "View all" → Expenses.
- Empty state (first run, no data): friendly illustration + "Add your first expense" / "Set up your first budget" CTAs, not a wall of zeros.

### Add Expense flow (Quick Add)
1. `Ctrl+E` anywhere in the app → glass modal opens instantly (120ms).
2. Fields, in tab order: Amount (numeric keypad-style, autofocus) → Category (searchable chip picker, defaults to last-used) → Date (defaults to today) → Note (optional, collapsed by default).
3. `Enter` submits. Toast confirms. Modal closes. Focus returns to wherever the user was.
4. Target: 3 keystrokes + Enter for a repeat category ("500" → Enter category shortcut key → Enter).
5. Full Expenses screen also has a "+ Add" button for the non-hotkey path, opening the same modal.

### Expenses screen
- Filterable/searchable table: date, category (with color dot), amount, note, edit/delete actions.
- Filters: date range, category (multi-select), amount range, free-text search — all combinable, all persisted per session.
- Bulk actions: export filtered results to CSV.
- Edit = inline row edit or reopen in the same Quick Add-style modal, pre-filled.
- Delete = confirm dialog (soft delete; recoverable for a grace period — see Backup strategy).

### Fixed Expenses (within Expenses screen, a tab)
- List of recurring templates with next due date.
- On the day a fixed expense is due, it appears as a **pending** item on the Dashboard ("3 fixed expenses due this month, 1 unconfirmed") — user confirms (posts as a real expense, editable at confirm time) or skips.

### Income screen
- Same table/filter pattern as Expenses, scoped to income_entries.
- "+ Add Income" mirrors Quick Add pattern but is a separate, less time-pressured flow (income is entered less often).

### Budgets screen
- Month selector at top.
- Overall budget input.
- Per-category budget rows, each a `BudgetBar` (spent / limit, color-coded, glow when >90%).
- "Copy last month's budget" quick action.

### Savings & Goals screen
- Goal cards (glass), each showing: name, type (General/DPS/Emergency/Goal), progress bar toward target, monthly contribution if recurring, target date.
- "+ Add contribution" per goal, and a general "+ Log savings" for ad-hoc entries.

### Reports screen
- Month (or range) selector.
- Summary: income, expenses, savings, net, budget adherence.
- Category breakdown table.
- Export buttons: CSV (MVP), PDF (post-MVP).

### Backup screen
- Last backup timestamp + gentle reminder if stale.
- "Back up now" (native save dialog).
- "Restore from file" (native open dialog, confirm dialog before overwrite).
- CSV export/import section.

### Settings screen
- Currency, theme (dark/light/system), DB file location, keyboard shortcut reference, category management (add/edit/archive custom categories), about/version.

## Empty states

Every list/chart has a designed empty state — never a bare "0" or blank chart. Short friendly copy + a single clear CTA (e.g., "No expenses yet this month — add your first one").

## Error states

- Inline field validation (Zod-driven) — errors appear under the field, not as a popup, and never block typing.
- System-level errors (DB write failed, backup failed) surface as a persistent (not auto-dismissing) toast/banner with a retry action — financial data errors are never silently swallowed.
- Destructive actions (delete entry, restore backup, delete category with data) always require explicit confirmation naming exactly what will happen.

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+E` | Quick Add Expense |
| `Ctrl+I` | Quick Add Income |
| `Ctrl+B` | Backup now |
| `Ctrl+K` | Search/command palette (jump to any screen) |
| `Ctrl+D` | Toggle dark/light |
| `Esc` | Close active modal |
| `Enter` | Submit active form |
