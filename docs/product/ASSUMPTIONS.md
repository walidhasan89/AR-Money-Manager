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

| 18 | Light mode fills in the tokens `DESIGN_SYSTEM.md` doesn't spell out: `--text-primary: #0A0E17`, `--text-secondary: rgba(10,14,23,0.6)` (dark text for contrast on a light background), `--glass-border: rgba(10,14,23,0.08)` / hover `rgba(10,14,23,0.16)` (dark-tinted instead of white-tinted). Accent colors (`--accent-primary/success/warning/danger`) and the glass blur radius stay identical across themes. | Smallest change that satisfies "same token names, same roles" while keeping ≥4.5:1 contrast, which a white-on-white or white-border-on-white scheme would fail. |
| 19 | One extra radius token beyond the documented 20px card radius: `--radius-control: 12px`, for inputs/buttons/smaller controls, at roughly half the card radius. | `DESIGN_SYSTEM.md` only specifies the glass-card radius; smaller controls need something visibly tighter than 20px, and CLAUDE.md requires all radii to come from tokens, not hardcoded values. |
| 20 | When `backdrop-filter` is unsupported/non-performant, the glass fallback raises `--glass-surface` opacity (dark: 0.06 → 0.14, light: 0.7 → 0.92) instead of blurring, per the "non-blurred fallback" requirement in CLAUDE.md. | Keeps panels readable against a busy background without blur, without inventing a whole second color set. |
| 21 | Tauri app identifier is `com.arfinance.desktop`; CSP is locked to `default-src 'self'` plus the minimum `style-src 'unsafe-inline'` (component libraries set inline `style=""`), `img-src`/`font-src` `data:`, and `connect-src`/`asset:` scoped to Tauri's own IPC/asset protocols — no remote origins anywhere. | No product identifier or exact CSP string was specified; this is the tightest CSP that still lets the WebView load its own bundled assets and talk to Tauri's IPC, matching "Tauri CSP locked down" / "no remote content." |
| 22 | Phase 1's theme toggle persists to `localStorage`, not the `settings` table, even though `settings.theme` is seeded. It gets wired to the real DB-backed setting once generic settings read/write commands exist (Settings feature, later phase). | Phase 1 scope is the app shell only — no Tauri commands for settings CRUD exist yet, and adding one just for theme would be a feature built ahead of its phase. |

## Open questions (non-blocking, revisit later)

- Exact category list and icons (starter set proposed in `docs/database/SCHEMA.md`, editable by user).
- Whether "employees" and "family support" need their own top-level report sections or are fine as categories (currently: categories).
- Whether a Bengali-language UI is ever wanted (currently: English only, structured so i18n could be added later).
