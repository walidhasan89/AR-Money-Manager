# Testing Strategy

## Principles

Correctness matters more here than in most side projects — this is math about real money. Testing effort is weighted toward calculation logic (budgets, aggregation, recurring generation) over UI polish.

## Unit testing
- **Scope**: currency formatting/parsing, monthly aggregation math, budget-vs-actual calculation, recurring fixed-expense date logic, CSV row mapping.
- **Tooling**: Vitest for TS/React logic; Rust's built-in `#[test]` for any Rust-side calculation or query-building logic.
- Every bug found in money math gets a regression test before the fix is considered done.

## Integration testing
- **Scope**: a Tauri command round-trip (e.g., `create_expense` → `list_expenses` reflects it → `get_monthly_summary` reflects it) against a real temp SQLite DB (not mocked), so schema/query mismatches are caught.
- Run against a fresh migrated DB each test run.

## UI testing
- **Scope**: critical flows only — Quick Add Expense end-to-end, budget creation, backup/restore confirmation flow.
- **Tooling**: Playwright (or Tauri's WebDriver support) for a small number of high-value flows; not aiming for exhaustive UI coverage given this is a small personal app.

## Database testing
- Migration tests: applying all migrations in order against an empty DB succeeds and produces the expected schema.
- Constraint tests: soft-delete behavior, unique constraints (e.g., one budget per category per month) are actually enforced.

## Backup/restore testing
- Backup produces a valid, openable SQLite file with matching row counts.
- Restore correctly replaces live data and creates the pre-restore safety copy.
- Restoring a corrupted/invalid file fails gracefully with a clear error, without touching the live DB.

## Regression testing
- Any fixed bug gets a named test referencing the bug/issue.
- Before each release, run the full suite plus a manual pass through `docs/phases/` Definition of Done checklists for all shipped phases.

## Release testing
- See `docs/release/RELEASE_PROCESS.md` — includes a manual smoke test checklist on a clean Windows environment (no dev tools installed) before tagging a release.
