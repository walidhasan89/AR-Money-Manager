# Assumptions

Per the execution rules, ambiguities are resolved here with reasonable defaults rather than blocking on questions. Revisit any of these at any time — they're defaults, not commitments.

## Product

| # | Assumption | Rationale |
|---|---|---|
| 1 | Single user, single household. No multi-user accounts, no permissions system. | Matches "no mandatory account" principle; you are the only user. |
| 2 | One SQLite database file = one "book." No multi-book/multi-company support in MVP. | Keeps schema and UI simple. Business expenses are just a category, not a separate ledger. |
| 3 | Currency is single-currency, default **BDT (৳)**, configurable in Settings. | You're in Bangladesh; app should show correct symbol out of the box. Multi-currency is future scope. |
| 4 | "Family expenses" and "business expenses" are **categories/tags**, not separate modules. | Avoids duplicating expense logic. A category filter answers "how much did I spend on family/business this month" just as well as a separate module would. |
| 5 | DPS (Deposit Pension Scheme) is modeled as a **recurring savings goal** with a fixed monthly contribution and maturity date, not a separate financial instrument type. | It behaves like a recurring fixed contribution toward a goal — same shape as any other savings goal, just pre-filled with DPS-typical fields (tenure, monthly installment, maturity value). |
| 6 | Budgets are **monthly**, reset each calendar month. No custom budget periods (weekly/yearly) in MVP. | Matches the stated core questions, all of which are monthly. |
| 7 | "Fixed expenses" are recurring expense **templates** that auto-generate a pending entry each month, which you confirm/edit rather than the app silently posting them. | Prevents surprise numbers on the dashboard; keeps you in control, matches "confirmation dialogs where necessary." |

## Technical

| # | Assumption | Rationale |
|---|---|---|
| 8 | OS target for MVP is **Windows 10/11 only**. macOS/Linux builds are possible later since Tauri is cross-platform, but not tested or packaged in MVP. | Matches stated primary platform; avoids QA burden across 3 OSes for a personal tool. |
| 9 | Database file lives in the OS app-data directory (`%APPDATA%\personal-finance-manager\`) by default, with a Settings option to relocate it (e.g., into a synced folder like OneDrive) for the user's own backup convenience. | Standard, discoverable, and doesn't force cloud infra while still letting you opt into your own sync. |
| 10 | No auto-update mechanism in MVP. Updates are manual downloads from GitHub Releases. | Avoids background network calls, consistent with offline-first/privacy-first principles. Tauri's updater can be added post-MVP behind an explicit opt-in. |
| 11 | No telemetry, crash reporting, or analytics of any kind, ever, unless explicitly requested later. | Privacy-first principle. |
| 12 | State management: **Zustand** (not Redux). Forms: **React Hook Form + Zod**. Dates: **date-fns**. Animation: **Framer Motion**. | Each is lightweight, has first-class TypeScript support, and is proportionate to a small app — avoids the bloat a larger toolkit would add. |
| 13 | SQLite access goes through `tauri-plugin-sql` (official Tauri plugin) rather than a custom Rust data layer, unless a specific feature (e.g., encrypted DB) requires dropping to raw Rust commands. | Least custom code, official support, sufficient for local CRUD + aggregation queries. |
| 14 | PDF export is **post-MVP** (CSV export ships first). | Matches roadmap note "PDF export later if useful"; CSV alone answers the core questions and is far simpler to implement well. |

## UX / Design

| # | Assumption | Rationale |
|---|---|---|
| 15 | Visual language: dark-mode-first "glass" / futuristic dashboard aesthetic (translucent panels, subtle blur, soft glow accents, smooth motion), with a light mode that keeps the same structure but a flatter/cleaner treatment (heavy blur glassmorphism reads best in dark UI). | Directly requested. Documented fully in `docs/ui-ux/DESIGN_SYSTEM.md`. |
| 16 | Animation is used for state transitions and feedback (page transitions, number count-ups, chart draw-in, success states) but never blocks or slows the Quick Add flow — animations are skippable/instant on repeat fast entry. | "Great animation" and "10-second expense entry" are in tension; the resolution is that delight lives in the dashboard, not in the hot path. |
| 17 | Quick Add Expense opens as an overlay/command-palette-style modal (triggered by `Ctrl+E`) rather than navigating to a new screen. | Fastest possible entry; no navigation cost. |

## Open questions (non-blocking, revisit later)

- Exact category list and icons (starter set proposed in `docs/database/SCHEMA.md`, editable by user).
- Whether "employees" and "family support" need their own top-level report sections or are fine as categories (currently: categories).
- Whether a Bengali-language UI is ever wanted (currently: English only, structured so i18n could be added later).
