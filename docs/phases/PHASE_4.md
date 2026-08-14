# Phase 4 — Dashboard

## Objective
The real, polished dashboard — this is where the glass/futuristic design direction and animation work concentrate most heavily.

## Features / Tasks
- 4 KPI glass tiles (Income, Expenses, Savings, Remaining) with animated count-up per `DESIGN_SYSTEM.md`.
- Charts (Recharts): spending by category (donut), daily spending (bar), budget vs actual (horizontal bars), savings trend (line) — all with the specified draw-in animation.
- Recent transactions panel.
- Pending fixed-expenses confirmation surface (built in Phase 2, wired to real UI here).
- Ambient animated background per `DESIGN_SYSTEM.md`.
- Empty states for a brand-new install with no data yet.
- Month selector affecting the whole dashboard scope.
- `prefers-reduced-motion` and low-end-hardware fallback handling (backdrop-blur fallback, animation degrade).

## Dependencies
Phases 2 and 3 complete (dashboard visualizes their data).

## Expected output
Opening the app answers all 6 core product-vision questions within ~15 seconds, and it looks and feels like the intended premium glass/futuristic product.

## Testing requirements
- Unit: KPI aggregation matches underlying expense/income/savings/budget data exactly (cross-check against Phase 2/3 totals).
- UI: dashboard renders correctly with zero data, with partial data, and with a full month of data.
- Performance: verify NFR-1 (cold start <2s) and NFR-8 (animations ~60fps, no jank) on typical hardware.

## Definition of Done
- [ ] All 4 KPI tiles and all 4 charts show correct, live-updating numbers.
- [ ] Animations match the spec in `DESIGN_SYSTEM.md` and respect reduced-motion settings.
- [ ] Dashboard looks correct in both dark and light themes.
- [ ] Cold start and interaction performance meet NFR targets.
