# Architecture Overview

## High-level shape

```
┌───────────────────────────────────────────────┐
│                  Tauri Shell                    │
│  ┌───────────────────────────────────────────┐ │
│  │   WebView (React + TypeScript + Tailwind)  │ │
│  │   - UI, state (Zustand), charts (Recharts) │ │
│  │   - Framer Motion animation layer           │ │
│  └───────────────────┬───────────────────────┘ │
│                       │ IPC (invoke/commands)    │
│  ┌───────────────────▼───────────────────────┐ │
│  │        Rust Core (Tauri commands)          │ │
│  │   - Thin command layer                     │ │
│  │   - tauri-plugin-sql (SQLite access)       │ │
│  │   - File system (backup/restore, CSV I/O)  │ │
│  └───────────────────┬───────────────────────┘ │
│                       │                          │
│               ┌───────▼────────┐                │
│               │  SQLite file     │                │
│               │  (local disk)    │                │
│               └──────────────────┘                │
└───────────────────────────────────────────────┘
```

No network layer exists in the MVP. Every arrow above stays inside the user's machine.

## Why Tauri over Electron

- Ships a Rust-native binary + system WebView instead of bundling Chromium → dramatically smaller installer and lower idle memory, which matters for a "lightweight and fast" personal tool.
- Rust backend gives a natural, safe place to own the SQLite connection and file I/O (backup/restore) behind a narrow command API, rather than trusting the JS layer with raw file system access.
- Mature Windows support (primary target platform), active plugin ecosystem including an official SQL plugin.

## Why React + TypeScript

- Best-fit for a data-dense, chart-heavy dashboard UI with frequent small updates (typing in Quick Add, live budget recalculation).
- TypeScript + Zod schemas give end-to-end type safety from DB row → IPC payload → UI, which matters a lot for a finance app where a wrong field mapping means a wrong number.

## Frontend structure

```
src/
  app/                # routing/shell, layout, theme provider
  features/
    dashboard/
    expenses/
    income/
    budgets/
    savings/
    reports/
    backup/
    settings/
  components/         # shared UI primitives (glass card, button, modal, etc.)
  lib/
    db/               # typed query functions wrapping tauri-plugin-sql calls
    ipc/               # typed wrappers around invoke()
    format/            # currency/date formatting helpers
  store/              # Zustand stores
  styles/             # Tailwind config, design tokens, glass utilities
```

Each `features/*` folder owns its screens, local components, and hooks — no cross-feature imports except through `lib/` and `components/`. This keeps the codebase splittable later (e.g., if a feature ever needs to become a separate window or, far in the future, a mobile screen).

## IPC communication

- All DB access happens through a small, explicit set of Rust Tauri **commands** (e.g., `list_expenses`, `create_expense`, `get_monthly_summary`) — the frontend never gets a raw SQL string across the IPC boundary.
- Each command has a typed Rust input/output struct (serde) and a matching TypeScript type generated/maintained by hand in `lib/ipc/types.ts`, kept in sync manually until the project is large enough to justify codegen.
- Aggregation (monthly totals, budget-vs-actual) is computed in SQL/Rust, not by pulling all rows into JS and summing client-side — keeps the dashboard fast as data grows.

## Security model

- No remote content is ever loaded in the WebView (Tauri CSP locked down, no external scripts).
- Tauri's allowlist/capabilities are scoped to exactly the commands and filesystem paths the app needs — no blanket filesystem or shell access.
- No secrets, API keys, or credentials exist in the MVP (no external services called). If the future AI features are added, any API key is stored via the OS keychain (Tauri's secure storage), never in plaintext config, and calls are opt-in per action, not automatic/background.
- Backups and CSV exports write only to a path explicitly chosen by the user via a native file dialog — the app never silently exports data.

## Local storage strategy

See `docs/database/SCHEMA.md` for schema and `BACKUP_STRATEGY.md` below for backup. In short: one SQLite file, in the OS app-data directory by default, relocatable in Settings.

## Backup strategy

See `docs/architecture/BACKUP_STRATEGY.md`.

## Future extensibility

Designed so these can be added later without a rewrite:
- **Multi-currency**: `settings.currency` is already a first-class concept; would need a rates table + per-entry currency field.
- **Mobile app**: the `features/*` structure and typed data layer are UI-shell-agnostic; a React Native or mobile-web client could reuse `lib/format` and the conceptual data model, though not the Tauri IPC layer directly.
- **Cloud sync (opt-in, future)**: UUID primary keys and `updated_at` timestamps on every table are chosen specifically so a future sync layer (e.g., last-write-wins) is possible without a primary-key migration.
- **AI features**: isolated to a `features/ai-insights` module that only ever reads already-computed local aggregates and calls an external API when the user explicitly triggers it — never automatic, never required.
