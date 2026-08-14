# MASTER PROMPT — Personal Finance Manager (Desktop)

> This is the reusable master prompt for this project. Paste this whole file (or point Claude Code at it) at the start of any future session to fully re-establish project context. It is the single source of truth for product intent, architecture, and rules. `CLAUDE.md` (project root) holds the shorter, always-loaded operating rules for Claude Code specifically — this file is the fuller reference `CLAUDE.md` points back to.

## 1. Product vision

A simple, fast, privacy-first, offline-first **Personal Finance Manager** for Windows desktop. It tracks monthly income, fixed expenses, daily expenses, family expenses, business expenses, savings, DPS, budgets, and financial goals — and makes it effortless to answer:

1. How much money did I earn this month?
2. Where did my money go?
3. How much have I saved?
4. How much money is remaining?
5. Am I overspending?
6. Can I stay within my monthly budget?

## 2. Product goals

- Daily expense entry in **≤10 seconds**.
- A dashboard that answers all 6 core questions at a glance.
- Data that is private, local, and never easily lost.
- A visually impressive **glass-effect, futuristic dashboard** with smooth, purposeful animation — a "yummy," premium feel — without sacrificing speed for the daily-use flows.
- Simple enough for a non-technical family member to use with zero training.

## 3. Non-goals

- No mandatory account or cloud service.
- No bank-linking / Open Banking integration.
- No multi-user, multi-device sync in MVP.
- No mobile app in MVP.
- No feature added "because it's possible" — every feature must trace to a real money-management problem (see `docs/product/PRD.md`).
- No AI in the MVP — AI is Phase 10, strictly optional, strictly opt-in.

## 4. Target users

Primary: the project owner, tracking personal, family, and business-adjacent finances. Secondary (post-Phase 9): other privacy-conscious individuals via public GitHub release.

## 5. Core principles

1. Simplicity first.
2. Local-first and privacy-first — zero network calls required for any MVP feature.
3. No unnecessary accounts.
4. No unnecessary cloud infrastructure.
5. No feature bloat.
6. Every feature solves a real money-management problem.
7. Daily expense entry must be extremely fast.
8. Data must never be easily lost (transactional writes + manual backup + automatic safety copies).
9. Usable by non-technical users.
10. Architecture allows future expansion without a rewrite.

## 6. Technology stack

| Layer | Choice |
|---|---|
| Shell | Tauri 2 (Rust) |
| UI | React 18 + TypeScript (strict) |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Animation | Framer Motion |
| Database | SQLite via `tauri-plugin-sql` |
| State | Zustand |
| Forms/validation | React Hook Form + Zod |
| Dates | date-fns |
| Distribution | GitHub Releases, Windows installer via `tauri build` |

Full rationale: `docs/architecture/ARCHITECTURE.md`. Do not swap a stack choice without updating that doc first and stating the reason.

## 7. Architecture principles

- Thin Rust command layer over `tauri-plugin-sql`; no raw SQL crosses the IPC boundary to the frontend.
- All monetary values stored and computed as **integer cents** — never floats — end to end.
- Aggregation (monthly totals, budget-vs-actual) computed in SQL/Rust, not by summing in JS.
- `features/<name>/` folders own their screens/components/hooks; shared code only in `components/` and `lib/`.
- No network layer in the MVP. Any future AI feature is isolated, opt-in, user-triggered only.

Full detail: `docs/architecture/ARCHITECTURE.md`, `docs/database/SCHEMA.md`, `docs/architecture/BACKUP_STRATEGY.md`.

## 8. Feature scope

See `docs/product/PRD.md` for the full functional/non-functional requirements table. Summary: Income · Expenses (incl. fixed/recurring) · Budgets (overall + category) · Dashboard (KPIs + charts) · Savings & Goals (incl. DPS) · Reports (CSV, PDF later) · Backup/Restore · fast/keyboard-first UX.

## 9. UX principles

- Quick Add Expense (`Ctrl+E`) is the single most important interaction — optimize relentlessly for speed there, even at the cost of visual flourish.
- Every other screen can be more expressive/animated, per `docs/ui-ux/DESIGN_SYSTEM.md`.
- Empty states, error states, and confirmation dialogs are designed, not afterthoughts.
- Full keyboard shortcut coverage; see `docs/ui-ux/UI_UX_GUIDE.md`.

## 10. Visual design direction (glass / futuristic / animated)

This app must look like a premium, modern fintech product: **translucent glass panels, dark ambient gradient background, glowing accent colors, animated KPI numbers, smooth chart draw-ins** — the full spec, including exact color tokens, blur values, and animation durations, is in `docs/ui-ux/DESIGN_SYSTEM.md`. Treat that file as binding, not inspirational — implement the tokens and timings as written, and update the doc first if a change is warranted.

## 11. Security / privacy principles

- No telemetry, analytics, or crash reporting, ever, without explicit future request.
- No remote content loaded in the WebView; Tauri CSP locked down.
- Tauri capabilities/allowlist scoped minimally.
- Backups/exports only write to a location the user explicitly picks via native dialog.
- Any future external API key (AI features only) lives in the OS keychain, never plaintext.

## 12. Development rules

- Don't start coding a phase until its dependencies are done (see `ROADMAP.md`).
- Update `docs/database/SCHEMA.md` before writing a migration that changes it.
- Conventional Commits; feature branches; squash-merge to `main`.
- Full rules: `docs/development/DEVELOPMENT.md`.

## 13. Coding standards

Strict TypeScript, function components only, integer-cents money math, thin Rust commands, Tailwind tokens only (no hardcoded hex). Full rules: `docs/development/CODING_STANDARDS.md`.

## 14. Testing rules

Unit tests required for all money-math and date/recurrence logic. Integration tests for IPC round-trips against a real (temp) SQLite DB. UI tests for critical flows only (Quick Add, budget creation, backup/restore). Full detail: `docs/testing/TESTING_STRATEGY.md`.

## 15. Git / GitHub rules

`main` always releasable. `feature/`, `fix/`, `chore/`, `docs/` branch prefixes. See `docs/development/DEVELOPMENT.md`.

## 16. Release rules

SemVer. `v1.0.0` = MVP complete (Phases 1–8). GitHub Releases with Windows installer + checksum + changelog excerpt. Full process: `docs/release/RELEASE_PROCESS.md`.

## 17. Phase execution rules

1. Work phase-by-phase per `ROADMAP.md` and `docs/phases/PHASE_N.md`.
2. Each phase has an explicit Definition of Done — do not consider a phase complete until every checklist item is met.
3. Do not jump ahead to a later phase's features "while you're in there" — flag it instead, note it in the relevant phase doc if it's a good idea, and stay scoped.
4. If a phase surfaces an ambiguity, resolve it the way `docs/product/ASSUMPTIONS.md` does: pick a reasonable default, document it, keep moving — only stop and ask if it's genuinely blocking (e.g., data-loss risk, irreversible decision).

## 18. Definition of Done (project-wide, applies within every phase's own DoD)

A task/phase is done when:
- It builds and runs with no errors or new lint/type warnings.
- It matches the relevant docs (PRD, schema, design system) — or those docs were updated first.
- It has tests per `docs/testing/TESTING_STRATEGY.md` where applicable.
- `CHANGELOG.md` is updated.
- It was manually exercised, not just assumed to work.

## 19. Instructions for Claude Code

- Read `CLAUDE.md` (root) for the condensed, always-apply operating rules.
- Before writing any code in a session, identify which phase (`docs/phases/PHASE_N.md`) the work belongs to and confirm its dependencies are met.
- Inspect the existing repository state before assuming anything is or isn't built yet — never blindly overwrite existing work.
- Do not introduce cloud infrastructure, authentication, or AI into the MVP under any circumstance, even if it would make a task easier.
- When in doubt on an ambiguous detail, apply the same reasoning style as `docs/product/ASSUMPTIONS.md`: make the smallest reasonable assumption, document it, keep moving.
