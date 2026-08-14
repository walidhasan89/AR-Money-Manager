# Phase 5 — Savings & Financial Goals

## Objective
Track general savings, DPS, emergency fund, and custom goals with progress visualization.

## Features / Tasks
- Goals CRUD (name, type, target amount, target date, monthly contribution for recurring types).
- Savings entry logging (ad-hoc and against a specific goal).
- Goal progress cards (glass) with progress bar/ring.
- DPS-specific fields (monthly installment, tenure, maturity value) as a specialized goal type per `ASSUMPTIONS.md` #5.
- Savings trend feeds into the Dashboard chart built in Phase 4 (wire real data if not already).

## Dependencies
Phase 4 complete (goal progress visuals reuse dashboard chart/animation components).

## Expected output
User can answer "how much have I saved?" with a full breakdown by type/goal, not just a single number.

## Testing requirements
- Unit: goal progress % calculation, DPS maturity projection math.
- Integration: logging a contribution updates both the specific goal's progress and the overall savings KPI.

## Definition of Done
- [ ] Goals can be created, edited, archived (not hard-deleted if they have contributions).
- [ ] Progress bars/rings accurately reflect contributions vs. target.
- [ ] DPS goals correctly project maturity value from installment × tenure.
- [ ] Dashboard "Savings" KPI and trend chart reflect real goal/savings data.
