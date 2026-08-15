-- Initial schema. Source of truth: docs/database/SCHEMA.md.
-- Never edit this file after it ships — add a new numbered migration instead.

PRAGMA foreign_keys = ON;

CREATE TABLE categories (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  is_system INTEGER NOT NULL DEFAULT 0 CHECK (is_system IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (name, type)
);

CREATE TABLE goals (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('savings', 'dps', 'emergency_fund')),
  target_amount_cents INTEGER CHECK (target_amount_cents IS NULL OR target_amount_cents >= 0),
  monthly_contribution_cents INTEGER CHECK (
    monthly_contribution_cents IS NULL OR monthly_contribution_cents >= 0
  ),
  target_date TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE fixed_expenses (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  category_id TEXT NOT NULL REFERENCES categories (id),
  day_of_month INTEGER NOT NULL CHECK (day_of_month BETWEEN 1 AND 28),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE income_entries (
  id TEXT PRIMARY KEY NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  category_id TEXT NOT NULL REFERENCES categories (id),
  source TEXT,
  date TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT
);

CREATE TABLE expenses (
  id TEXT PRIMARY KEY NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  category_id TEXT NOT NULL REFERENCES categories (id),
  date TEXT NOT NULL,
  note TEXT,
  fixed_expense_id TEXT REFERENCES fixed_expenses (id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT
);

CREATE INDEX idx_expenses_date ON expenses (date);
CREATE INDEX idx_expenses_category_id ON expenses (category_id);
CREATE INDEX idx_expenses_fixed_expense_id ON expenses (fixed_expense_id);

CREATE TABLE savings_entries (
  id TEXT PRIMARY KEY NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  type TEXT NOT NULL CHECK (type IN ('general', 'dps', 'emergency_fund', 'goal')),
  goal_id TEXT REFERENCES goals (id),
  date TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT
);

CREATE TABLE budgets (
  id TEXT PRIMARY KEY NOT NULL,
  month TEXT NOT NULL,
  category_id TEXT REFERENCES categories (id),
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (month, category_id)
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE backups_log (
  id TEXT PRIMARY KEY NOT NULL,
  file_path TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  trigger TEXT NOT NULL CHECK (trigger IN ('manual', 'pre_restore_safety'))
);

-- Seed default settings (docs/product/ASSUMPTIONS.md #3: default currency BDT).
INSERT INTO settings (key, value) VALUES ('currency', 'BDT');
INSERT INTO settings (key, value) VALUES ('theme', 'dark');

-- Seed default categories (docs/database/SCHEMA.md "Seeded defaults").
INSERT INTO categories (id, name, type, icon, color, is_system) VALUES
  ('18d83cb2-4ad3-4825-a507-d8633e05512d', 'Groceries', 'expense', 'shopping-cart', '#3DDC97', 1),
  ('65db217b-b3e1-42cc-aa74-e32bd591d3c7', 'House Rent', 'expense', 'home', '#6C7CFF', 1),
  ('5f1c4347-d66b-4cce-919f-4bfd38936d54', 'Utilities', 'expense', 'zap', '#FFB648', 1),
  ('0280e71c-6687-474a-a18b-59bd6d6c5b94', 'Transport', 'expense', 'car', '#4EA1FF', 1),
  ('a40cf3c3-b59b-40d3-b4da-265461d4e41d', 'Mobile', 'expense', 'smartphone', '#8B7CFF', 1),
  ('06ee0fdf-3c49-4f23-819e-597bd7920050', 'Subscriptions', 'expense', 'repeat', '#C77CFF', 1),
  ('69d4ea6c-b501-4113-991a-0ec7188c9e71', 'Family Support', 'expense', 'users', '#FF8FB1', 1),
  ('83fd805b-df5b-4c87-8c19-84ba12205cb7', 'Employees', 'expense', 'briefcase', '#5CC8FF', 1),
  ('749859b0-d7f6-4fc6-82b8-d180367c92d8', 'Business', 'expense', 'building-2', '#3DA5DC', 1),
  ('d1e6b841-701d-4949-8a63-da4183d3e4fa', 'Health', 'expense', 'heart-pulse', '#FF5C7A', 1),
  ('7dd61fea-d8d4-48e7-b459-73a67244d420', 'Dining', 'expense', 'utensils', '#FF9A5C', 1),
  ('eed34a73-140b-475b-b503-70bcd2a926e5', 'Shopping', 'expense', 'shopping-bag', '#FFB648', 1),
  ('35bb4599-36e7-491f-aec8-837f329b1ef4', 'Entertainment', 'expense', 'film', '#C77CFF', 1),
  ('7c267db9-06ae-4c89-8176-2618d64a2c61', 'Other', 'expense', 'more-horizontal', '#9AA3B2', 1),
  ('be34f2bc-727e-494e-bb7f-fd44106b919a', 'Salary', 'income', 'wallet', '#3DDC97', 1),
  ('671f9ee2-0687-4ae5-bd50-cdbaf12ffd7d', 'Business Income', 'income', 'trending-up', '#3DA5DC', 1),
  ('d46f56a3-1322-4e9d-b600-3799c1bc447e', 'Freelance', 'income', 'laptop', '#6C7CFF', 1),
  ('4998637e-e4aa-4050-8d65-cc47f2029eca', 'Other', 'income', 'more-horizontal', '#9AA3B2', 1);
