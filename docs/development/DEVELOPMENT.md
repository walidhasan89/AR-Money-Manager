# Development Workflow

## Git workflow

- `main` is always releasable/stable.
- Work happens on feature branches: `feature/<phase>-<short-name>` (e.g., `feature/p2-expense-crud`).
- One phase (or a clear sub-slice of a large phase) per branch/PR where practical, matching `docs/phases/`.
- Squash-merge to `main` with a clean summary commit message.

## Branch naming

`feature/...`, `fix/...`, `chore/...`, `docs/...` — always lowercase, hyphenated.

## Commit conventions

Conventional Commits style:
```
feat(expenses): add quick-add modal with keyboard shortcut
fix(budgets): correct over-budget threshold rounding
docs(phases): add Phase 4 dashboard breakdown
chore(deps): bump tauri to 2.x
```

## Development workflow (per feature)

1. Read the relevant phase doc in `docs/phases/` and the relevant section of `PRD.md`.
2. If touching the schema, update `docs/database/SCHEMA.md` first, then write the migration.
3. Implement.
4. Self-verify against that phase's Definition of Done (build, run, manually exercise the feature).
5. Update `CHANGELOG.md` under "Unreleased."
6. Open PR / present the diff for review.

## Code review expectations

Even in a single-developer/Claude-Code-assisted project, treat every change as reviewable:
- Does it match the schema/architecture docs, or did those docs need updating first?
- Is there a test (see `docs/testing/TESTING_STRATEGY.md`) for new business logic (budget calculations, monthly aggregation, recurring-expense generation)?
- Any new dependency justified in the PR description (per "avoid unnecessary dependencies")?

## Release workflow

See `docs/release/RELEASE_PROCESS.md`.
