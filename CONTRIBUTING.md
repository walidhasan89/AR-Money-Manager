# Contributing

This started as a personal tool and is documented to a professional standard so it can be built phase-by-phase with Claude Code and, eventually, accept outside contributions after public release (Phase 9).

## Before contributing

1. Read `MASTER_PROMPT.md` and `docs/product/PRD.md` to understand product intent and boundaries.
2. Read `ROADMAP.md` and the relevant `docs/phases/PHASE_N.md` — contributions should map to a phase or an explicitly scoped fix, not ad-hoc feature additions.
3. Read `docs/development/CODING_STANDARDS.md` and `docs/development/DEVELOPMENT.md`.

## Workflow

1. Branch from `main`: `feature/<short-name>` or `fix/<short-name>`.
2. Follow Conventional Commits (see `docs/development/DEVELOPMENT.md`).
3. Add/update tests per `docs/testing/TESTING_STRATEGY.md` for any logic change, especially anything touching money math.
4. Update `docs/database/SCHEMA.md` *before* writing a migration, if the change touches the schema.
5. Update `CHANGELOG.md` under "Unreleased."
6. Open a PR describing what phase/issue this addresses and how it was tested.

## What won't be accepted

- Features not traceable to `PRD.md`/`ROADMAP.md` scope (open a discussion first if you think something's missing).
- Anything introducing a mandatory account, cloud dependency, or telemetry — this project's privacy-first principle is non-negotiable.
- New dependencies without justification in the PR description.
- UI changes that don't follow `docs/ui-ux/DESIGN_SYSTEM.md` tokens/patterns.

## Code of conduct

Be respectful, be specific, assume good faith. This is a small project — clear, kind communication matters more than process.
