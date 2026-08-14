# Roadmap

Full detail for each phase lives in `docs/phases/PHASE_N.md`. This is the at-a-glance view.

## MVP (v1.0.0) — Phases 1–8

| Phase | Name | Ships |
|---|---|---|
| 1 | Technical Foundation | Running app shell, DB + migrations, design tokens, tooling |
| 2 | Core Expense & Income Tracking | Quick Add, full CRUD, search/filter, fixed expenses |
| 3 | Budget System | Overall + category budgets, live budget-vs-actual, warnings |
| 4 | Dashboard | KPI tiles, charts, glass/futuristic UI + animation |
| 5 | Savings & Financial Goals | General/DPS/Emergency/Goal tracking with progress |
| 6 | Reports | Monthly summary, category breakdown, CSV export |
| 7 | Backup & Data Portability | Manual backup/restore, safety copies, CSV export/import |
| 8 | UX Polish | Shortcuts, command palette, empty/error states, accessibility, final animation pass |

**MVP is done when Phase 8's Definition of Done is met.** That's a fully daily-driveable, private, offline finance app with the intended visual polish.

## Post-MVP — Phase 9

| Phase | Name | Ships |
|---|---|---|
| 9 | GitHub / Public Release | Public README, license, signed/documented installer, `v1.0.0` GitHub Release |

## Future / Optional — Phase 10

| Phase | Name | Ships |
|---|---|---|
| 10 | Optional AI Features | Opt-in, never-required natural-language insights layered on stable core |

Also future/optional, not yet phased in detail (add a phase doc if/when prioritized):
- PDF report export
- Multi-month trend analysis beyond the MVP charts
- Multi-currency support
- macOS/Linux builds
- Encrypted database at rest
- Auto-update mechanism

## Execution rules (apply to every phase)

1. Don't start a phase's code until its dependencies (listed in its phase doc) are actually done, not just "mostly done."
2. Don't skip the Definition of Done checklist.
3. If a phase reveals the schema or architecture docs need to change, update the docs *before* writing the code that depends on the change.
4. Keep MVP scope exactly as defined here — resist adding Phase 10-ish features early just because they're easy in the moment.
