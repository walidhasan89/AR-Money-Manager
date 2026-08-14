# Product Requirements Document (PRD)

## 1. Problem statement

Tracking personal, family, and small-business finances across multiple mental "buckets" (fixed bills, daily spend, savings, DPS, budgets, goals) is normally split across a notebook, a bank app, and a spreadsheet — none of which agree with each other, and none of which are fast enough to update every single day. The result: at any given moment, it's genuinely hard to answer "where did my money go?" or "am I overspending?" without a manual reconciliation session.

## 2. Target user

You: a single individual managing personal, family, and business-adjacent expenses, comfortable with desktop software, wants a private local tool rather than a bank-linked app or cloud budgeting SaaS. Secondarily, this becomes a public GitHub project other privacy-conscious individuals with similar needs can use.

## 3. User stories

### Must-have (MVP)
- As a user, I can log a new expense in under 10 seconds, including amount, category, date, and an optional note.
- As a user, I can see my total income, total expenses, savings, and remaining balance for the current month at a glance.
- As a user, I can define fixed monthly expenses once and have them recur automatically as pending entries each month.
- As a user, I can set a monthly budget overall and per category, and see how much I've spent against it in real time.
- As a user, I get a visible warning when I'm approaching or have exceeded a budget.
- As a user, I can record contributions to savings, DPS, and financial goals, and see progress toward each goal.
- As a user, I can search and filter my expense history by date range, category, and keyword.
- As a user, I can edit or delete any past entry.
- As a user, I can export my data to CSV at any time.
- As a user, I can manually back up and restore my entire database.
- As a user, I never need an internet connection or an account to use any core feature.

### Should-have (Post-MVP)
- As a user, I can export a polished monthly summary as PDF.
- As a user, I can see multi-month trend charts (spending trend, savings trend).
- As a user, I can toggle dark/light mode and it's remembered.

### Could-have (Future)
- As a user, I can ask "where did my money go this month?" and get a plain-language AI summary generated entirely from my local data.
- As a user, I get a proactive nudge if a category is trending toward overspending, before the month ends.
- As a user, I can ask "can I afford [purchase] this month?" and get an answer based on my current budget state.

### Explicit non-goals
- Bank account linking / Open Banking integration.
- Multi-user / multi-device sync.
- Mobile app (for now).
- Investment portfolio tracking (stocks, mutual funds) beyond simple "savings" entries.
- Multi-currency simultaneous tracking (single configurable currency only).
- Any mandatory cloud service or account.

## 4. Functional requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-1 | User can create, edit, delete, and list income entries with amount, source, date. | MVP |
| FR-2 | User can create, edit, delete expenses with amount, category, date, note. | MVP |
| FR-3 | User can search/filter expenses by date range, category, amount range, keyword. | MVP |
| FR-4 | User can define recurring fixed-expense templates that generate a monthly pending entry requiring confirmation. | MVP |
| FR-5 | User can create savings entries under types: General, DPS, Emergency Fund, Goal. | MVP |
| FR-6 | User can create financial goals with a target amount, target date, and track contributions against them. | MVP |
| FR-7 | User can set an overall monthly budget and per-category budgets. | MVP |
| FR-8 | System computes budget-vs-actual in real time and flags categories over/near their limit. | MVP |
| FR-9 | Dashboard shows current-month income, expenses, savings, remaining balance, and budget usage at a glance. | MVP |
| FR-10 | Dashboard shows charts: spending by category, daily spending, budget vs actual, savings trend. | MVP |
| FR-11 | User can generate a monthly summary report and export it as CSV. | MVP |
| FR-12 | User can manually trigger a full database backup to a chosen location, and restore from a backup file. | MVP |
| FR-13 | Quick Add Expense is reachable via a global shortcut (`Ctrl+E`) and completable without leaving the keyboard. | MVP |
| FR-14 | User can export/import data as CSV for portability. | MVP |
| FR-15 | User can export a monthly report as PDF. | Post-MVP |
| FR-16 | User can view multi-month trend charts. | Post-MVP |
| FR-17 | User can toggle and persist dark/light theme. | MVP (default dark) |
| FR-18 | AI-powered natural-language spending analysis, run locally against an external LLM API only with explicit opt-in. | Future |

## 5. Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-1 | Cold start to interactive dashboard in under 2 seconds on typical hardware. |
| NFR-2 | Quick Add Expense flow completable in ≤10 seconds for a typical entry. |
| NFR-3 | All data stored locally; zero network calls required for any MVP feature. |
| NFR-4 | Application binary/installer size stays lightweight (target: under ~15MB installer, consistent with Tauri's footprint vs. Electron). |
| NFR-5 | No data loss on unexpected app close (writes are transactional/committed immediately, not buffered in memory only). |
| NFR-6 | UI is usable by a non-technical family member with zero training (clear labels, confirmation dialogs on destructive actions, no jargon). |
| NFR-7 | Codebase structured so a future mobile app, multi-currency support, or cloud sync could be added without a full rewrite. |
| NFR-8 | Animations run at 60fps on typical hardware and never add more than ~150ms perceived delay to any core action. |

## 6. MVP scope (ship first)

Income tracking → Expense tracking (incl. fixed expenses) → Budgets → Dashboard → Savings/Goals → CSV reports → Backup/Restore → Core UX polish (Quick Add, shortcuts, dark/light, glass dashboard design).

This is Phases 1–8 in `ROADMAP.md`.

## 7. Post-MVP / Future scope

PDF export, multi-month trend analysis, GitHub public release polish (Phase 9), AI features (Phase 10) — see `ROADMAP.md`.

## 8. Success criteria

The app is successful if, at any moment, you can open it and answer all six core questions from the product vision in under 15 seconds, without doing mental math.
