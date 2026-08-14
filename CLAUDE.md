# CLAUDE.md — Instructions for Claude Code

This file is read automatically by Claude Code at the start of every session in this repo. It's the condensed, always-apply rule set. For full product/architecture context, see `MASTER_PROMPT.md` and the `/docs` tree it links to.

## Project overview

Offline-first, privacy-first Personal Finance Manager desktop app (Windows primary). Tracks income, expenses (incl. fixed/recurring), budgets, savings/goals/DPS, with a glass-effect/futuristic animated dashboard. No accounts, no cloud, no mandatory network access. Full detail: `MASTER_PROMPT.md`.

## Tech stack (do not change without updating `docs/architecture/ARCHITECTURE.md` first)

Tauri 2 · React 18 + TypeScript (strict) · Tailwind CSS · Recharts · Framer Motion · SQLite via `tauri-plugin-sql` · Zustand · React Hook Form + Zod · date-fns.

## Directory structure

```
src/
  app/            # routing, layout, theme provider
  features/       # one folder per feature (dashboard, expenses, income, budgets, savings, reports, backup, settings)
  components/     # shared UI primitives only
  lib/
    db/           # typed query functions
    ipc/          # typed invoke() wrappers
    format/       # currency/date formatting
  store/          # Zustand stores
  styles/         # Tailwind config, design tokens
src-tauri/        # Rust: commands, migrations, SQL queries
docs/             # full documentation — read before touching architecture, schema, or design
```

## Coding conventions

- TypeScript strict mode, no unexplained `any`.
- Function components + hooks only.
- **Money is always integer cents**, in TS and Rust, end to end. Convert to a display string only via the shared `formatCurrency()` helper, only at render time. Never do float arithmetic on money.
- Tailwind utility classes by default; extract a component only after a pattern repeats 3+ times.
- No hardcoded colors/hex — use the design tokens defined in `docs/ui-ux/DESIGN_SYSTEM.md`.
- Conventional Commits for every commit message.

## Architecture rules

- Frontend never sends raw SQL over IPC — only typed Tauri commands.
- Aggregation/summary math (monthly totals, budget-vs-actual) happens in Rust/SQL, not by summing rows client-side.
- `features/<name>/` is self-contained; cross-feature sharing only through `lib/` or `components/`.
- No network calls anywhere in the MVP. If a future Phase 10 AI feature is worked on, it must live in an isolated `features/ai-insights` module, be entirely user-triggered, and the rest of the app must work identically with it removed.

## Database rules

- Full schema lives in `docs/database/SCHEMA.md` — **update that doc before writing a migration that changes the schema**, not after.
- Migrations are additive, numbered SQL files. Never edit a migration that has already shipped.
- All amounts: `INTEGER` cents, never `REAL`.
- Soft-delete (`deleted_at`) on user data tables (expenses, income, savings); hard-delete only on config/templates.

## UI rules

- Follow `docs/ui-ux/DESIGN_SYSTEM.md` exactly for colors, blur, radii, and animation durations/easing — it's a binding spec, not a suggestion.
- Quick Add Expense (`Ctrl+E`) is the one interaction that must stay near-instant (<150ms total animation budget) — never add "delight" motion there. Everything else (dashboard, reports) can be more expressive.
- Every list/chart needs a designed empty state; every destructive action needs a confirmation dialog naming exactly what will happen.
- Respect `prefers-reduced-motion` and provide a non-blurred fallback if backdrop-filter isn't performant.

## Testing requirements

- Any new money-math or date/recurrence logic needs a unit test (Vitest / Rust `#[test]`).
- Any new Tauri command needs an integration test round-tripping against a real temp SQLite DB.
- Full strategy: `docs/testing/TESTING_STRATEGY.md`. Don't skip tests to move faster on financial calculation code specifically.

## Git rules

- Branch: `feature/...`, `fix/...`, `chore/...`, `docs/...`.
- `main` stays releasable at all times.
- Update `CHANGELOG.md` (`Unreleased` section) with every user-facing change.

## Security rules

- No telemetry, analytics, or crash reporting — ever, unless explicitly asked for in a future prompt.
- No remote content in the WebView.
- Backups/exports/imports only touch paths the user explicitly picks via a native dialog.
- Any future external API key goes in the OS keychain, never a plaintext file or the SQLite DB.

## What Claude must NEVER do

- Never write application code before checking which phase (`docs/phases/PHASE_N.md`) it belongs to and confirming dependencies are met.
- Never add authentication, an account system, or a cloud backend "to make something easier" — this is a firm non-goal.
- Never add AI calls into the MVP (Phases 1–9). AI is Phase 10 only, and only when explicitly requested to start it.
- Never use floating-point math for money.
- Never edit a migration file that has already shipped — add a new one.
- Never overwrite existing files in this repo without first inspecting what's already there.
- Never silently skip a phase's Definition of Done checklist.
- Never introduce a new dependency without a one-line justification in the commit/PR description.

## How Claude should approach tasks

1. Identify the relevant phase doc (`docs/phases/PHASE_N.md`) and re-read its objective, tasks, and Definition of Done.
2. Check the current repo state — don't assume a clean slate or assume something is already built.
3. If the task touches the schema or design system, update the relevant `/docs` file first.
4. Implement in small, reviewable increments, favoring clarity over cleverness.
5. If something in the brief is ambiguous and not already covered in `docs/product/ASSUMPTIONS.md`, make the smallest reasonable assumption, add it to that file, and keep moving — only stop to ask if it's genuinely blocking or risks data loss.

## How Claude should verify work

1. Build/run with no new errors, type errors, or lint warnings.
2. Run relevant tests (unit for logic changes, integration for new commands).
3. Manually exercise the feature — don't declare something working purely from reading the code.
4. Check the phase's Definition of Done checklist item by item before calling it complete.
5. Update `CHANGELOG.md`.
