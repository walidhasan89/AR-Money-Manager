# Coding Standards

## TypeScript / React

- Strict TypeScript (`strict: true`). No `any` without an explicit `// eslint-disable` comment explaining why.
- Function components + hooks only. No class components.
- Props typed with explicit `interface Props { ... }`, not inline object types, for anything reused.
- All monetary values in TS are handled as **integer cents** end-to-end; conversion to display currency happens only at the final render step via a single shared `formatCurrency()` helper. Never do float math on money.
- Co-locate a feature's components, hooks, and types inside `features/<feature>/`; only promote to `components/` or `lib/` once used by 2+ features.
- Prefer composition over configuration props explosion (e.g., `<GlassCard><KpiTile .../></GlassCard>` over a mega-component with 20 boolean props).

## Rust (Tauri commands)

- Commands are thin: validate input, call a query/service function, map errors to a typed `Result<T, AppError>`, return. No business logic embedded directly in the `#[tauri::command]` function body beyond that orchestration.
- All SQL lives in named query functions, not inlined ad-hoc in command handlers, so it's testable and greppable.
- Every fallible operation returns a `Result`; no `unwrap()`/`expect()` on anything touching user data or the filesystem outside of tests.

## Styling

- Tailwind utility classes are the default; extract to a component only when a pattern repeats 3+ times (per `DESIGN_SYSTEM.md` tokens).
- Design tokens (colors, blur values, radii) live in `tailwind.config` / CSS variables — never hardcode a hex value in a component.

## General

- No feature is added because it's "easy to add" — every PR should be traceable to a line item in `PRD.md` or `ROADMAP.md`.
- No new dependency without checking: does an existing dependency already solve this? Is the bundle/binary size cost worth it for a lightweight desktop app?
- Prefer clarity over cleverness — this is a solo/AI-assisted codebase that needs to be re-understandable months later with no verbal context.
