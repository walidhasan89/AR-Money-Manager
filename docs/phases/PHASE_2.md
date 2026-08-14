# Phase 2 — Core Expense & Income Tracking

## Objective
The daily-use core: fast expense entry, income entry, full CRUD, search/filter, and fixed (recurring) expenses.

## Features / Tasks
- Expense CRUD: create, edit, delete (soft delete), list.
- Income CRUD (same pattern).
- **Quick Add Expense** modal (`Ctrl+E`) per `docs/ui-ux/UI_UX_GUIDE.md` — this is the highest-priority interaction in the whole app; build and tune it carefully against the ≤10s target.
- Category picker (searchable, shows seeded + user-created categories).
- Expenses screen: table, filters (date range, category, amount range, keyword), CSV export of filtered results.
- Fixed Expenses: template CRUD + monthly pending-confirmation flow on the Dashboard placeholder (real Dashboard is Phase 4, but the "pending fixed expense" surface needs to exist here).
- Category management (add/edit/archive) in Settings (basic version).

## Dependencies
Phase 1 complete.

## Expected output
A user can log every expense and income entry they'd realistically have, search/filter their history, and set up recurring bills that show up as pending each month.

## Testing requirements
- Unit: currency parsing/formatting, fixed-expense due-date calculation.
- Integration: `create_expense` → `list_expenses` → `update_expense` → soft-`delete_expense` round trip against real SQLite.
- UI: Quick Add end-to-end flow (Playwright), timed to confirm it's fast.

## Definition of Done
- [ ] Quick Add Expense completable via keyboard alone in ≤10 seconds for a repeat category.
- [ ] Expense/income edit and delete work with confirmation dialogs.
- [ ] Filters combine correctly (date + category + keyword together).
- [ ] CSV export produces a correct, Excel-openable file.
- [ ] Fixed expense template generates a pending item on/after its due date and confirming it creates a real expense row linked via `fixed_expense_id`.
