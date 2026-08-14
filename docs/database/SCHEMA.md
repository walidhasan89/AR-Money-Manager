# Database Schema (SQLite)

Documentation only — **not implemented yet**. This is the target schema for Phase 1/2.

## Design principles

- Every monetary amount stored as **INTEGER cents** (e.g., ৳1,250.50 → `125050`), never as REAL/FLOAT, to avoid floating-point rounding errors in financial math.
- Every table has an `id` (TEXT UUID, generated app-side) as primary key, not autoincrement — safer for future merge/sync scenarios.
- `created_at` / `updated_at` on every table (ISO-8601 strings, UTC).
- Soft-delete (`deleted_at NULL`) on user-entered records (income, expenses, savings entries) so accidental deletes are recoverable before a real purge; hard-delete on templates/config.
- Foreign keys enforced (`PRAGMA foreign_keys = ON`).

## Tables

### `categories`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | |
| name | TEXT | unique, e.g. "Groceries" |
| type | TEXT | `expense` \| `income` |
| icon | TEXT | icon identifier for UI |
| color | TEXT | hex, used for charts |
| is_system | INTEGER | 1 = seeded default, 0 = user-created |
| created_at | TEXT | |

Seeded defaults (expense): Groceries, House Rent, Utilities (WiFi/Gas/Electricity), Transport, Mobile, Subscriptions, Family Support, Employees, Business, Health, Dining, Shopping, Entertainment, Other.
Seeded defaults (income): Salary, Business Income, Freelance, Other.

### `income_entries`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | |
| amount_cents | INTEGER | |
| category_id | TEXT FK → categories | |
| source | TEXT | free text, e.g. employer name |
| date | TEXT | ISO date |
| note | TEXT NULL | |
| created_at, updated_at, deleted_at | TEXT | |

### `expenses`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | |
| amount_cents | INTEGER | |
| category_id | TEXT FK → categories | |
| date | TEXT | ISO date |
| note | TEXT NULL | |
| fixed_expense_id | TEXT NULL FK → fixed_expenses | set if generated from a recurring template |
| created_at, updated_at, deleted_at | TEXT | |

Indexes: `(date)`, `(category_id)`, `(fixed_expense_id)`.

### `fixed_expenses` (recurring templates)
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | |
| name | TEXT | e.g. "House Rent" |
| amount_cents | INTEGER | default amount, editable per occurrence |
| category_id | TEXT FK → categories | |
| day_of_month | INTEGER | 1–28, when it becomes due |
| is_active | INTEGER | 1/0, pause without deleting |
| created_at, updated_at | TEXT | |

### `savings_entries`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | |
| amount_cents | INTEGER | |
| type | TEXT | `general` \| `dps` \| `emergency_fund` \| `goal` |
| goal_id | TEXT NULL FK → goals | set when type = `goal` or `dps` tied to a goal |
| date | TEXT | |
| note | TEXT NULL | |
| created_at, updated_at, deleted_at | TEXT | |

### `goals`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | |
| name | TEXT | e.g. "Emergency Fund", "DPS - 5yr", "New Laptop" |
| type | TEXT | `savings` \| `dps` \| `emergency_fund` |
| target_amount_cents | INTEGER NULL | nullable for open-ended goals |
| monthly_contribution_cents | INTEGER NULL | for DPS/recurring goals |
| target_date | TEXT NULL | ISO date |
| is_active | INTEGER | |
| created_at, updated_at | TEXT | |

### `budgets`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | |
| month | TEXT | `YYYY-MM` |
| category_id | TEXT NULL FK → categories | NULL row = overall monthly budget |
| amount_cents | INTEGER | |
| created_at, updated_at | TEXT | |

Unique constraint: `(month, category_id)`.

### `settings`
| Column | Type | Notes |
|---|---|---|
| key | TEXT PK | e.g. `currency`, `theme`, `db_backup_path` |
| value | TEXT | |

### `backups_log`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | |
| file_path | TEXT | |
| created_at | TEXT | |
| trigger | TEXT | `manual` \| `pre_restore_safety` |

## Relationships

- `expenses.category_id → categories.id` (many-to-one)
- `expenses.fixed_expense_id → fixed_expenses.id` (many-to-one, nullable)
- `income_entries.category_id → categories.id`
- `savings_entries.goal_id → goals.id` (nullable)
- `budgets.category_id → categories.id` (nullable = overall budget)

## Derived/aggregate views (computed, not stored)

- Monthly totals (income, expense, savings, remaining) — computed via `SUM()` queries scoped to date range, exposed through a data-access layer function, not a stored table, so numbers are always live and correct.
- Budget vs actual — join `budgets` with `SUM(expenses.amount_cents)` grouped by category for the month.

## Migration strategy

- Migrations are plain numbered SQL files (`001_init.sql`, `002_add_goals.sql`, ...) run in order on app startup via `tauri-plugin-sql`'s migration support.
- A `schema_migrations` table (managed by the plugin) tracks which have run.
- **Never edit a shipped migration file.** Always add a new one. This keeps every user's DB history reproducible.
- Before any migration that alters/drops a column, an automatic pre-migration backup is taken (see `docs/architecture/BACKUP_STRATEGY.md`).

## Constraints & integrity rules

- `amount_cents` always `>= 0`; sign/direction is implied by which table it's in (income vs. expense vs. savings), not by a signed number — avoids sign-flip bugs.
- Deleting a `category` that has entries is blocked in the UI; user must reassign entries first (enforced at the application layer, not just DB FK).
- Deleting a `fixed_expenses` template does not delete already-generated `expenses` rows (historical integrity preserved).
