# Phase 6 — Reports

## Objective
Monthly summary reporting and CSV export as a first-class report, not just a table export.

## Features / Tasks
- Reports screen: month/range selector, summary (income, expenses, savings, net, budget adherence), category breakdown table.
- CSV export of the full report (not just raw rows — a structured summary export).
- (Optional, if time allows within this phase) PDF export — otherwise explicitly deferred to Post-MVP per `ASSUMPTIONS.md` #14.

## Dependencies
Phases 2–5 complete (reports aggregate across all of them).

## Expected output
A clean monthly summary a user could screenshot or export to review spending/savings history at a glance, or hand off (e.g., to an accountant) as CSV.

## Testing requirements
- Unit: report aggregation matches Dashboard KPI numbers exactly for the same period (cross-check, catches drift between the two aggregation code paths).
- Integration: CSV report export opens correctly and contains expected totals.

## Definition of Done
- [ ] Monthly summary numbers match Dashboard numbers for the same month.
- [ ] Category breakdown table sums correctly to the total.
- [ ] CSV export succeeds and is well-formed.
