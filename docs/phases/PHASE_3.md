# Phase 3 — Budget System

## Objective
Overall and per-category monthly budgets with live budget-vs-actual tracking and overspending warnings.

## Features / Tasks
- Budgets screen: set overall monthly budget + per-category budgets.
- "Copy last month's budget" action.
- Budget-vs-actual calculation service (Rust/SQL aggregation, not client-side summing — see `ARCHITECTURE.md`).
- `BudgetBar` component (per `DESIGN_SYSTEM.md`) with warning (≥80%) and danger (≥100%) states.
- Overspending warning surfaced both on the Budgets screen and as a Dashboard-ready summary (Dashboard itself is Phase 4).

## Dependencies
Phase 2 complete (needs real expense data to budget against).

## Expected output
User can answer "am I overspending?" and "can I stay within my monthly budget?" directly from this screen.

## Testing requirements
- Unit: budget-vs-actual math, warning/danger threshold logic, edge cases (no budget set, budget set mid-month, category with no spend).
- Integration: budget totals stay correct after editing/deleting an expense.

## Definition of Done
- [ ] Setting an overall and per-category budget persists correctly per month.
- [ ] Budget bars update live (no manual refresh) as expenses are added/edited/deleted.
- [ ] Warning/danger states trigger at the documented thresholds.
- [ ] "Copy last month" correctly duplicates the prior month's category budgets.
