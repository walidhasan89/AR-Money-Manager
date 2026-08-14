-- Adds fixed-expense monthly "skip" tracking (Phase 2 pending-confirmation flow).
-- Never edit this file after it ships — add a new numbered migration instead.

CREATE TABLE fixed_expense_skips (
  id TEXT PRIMARY KEY NOT NULL,
  fixed_expense_id TEXT NOT NULL REFERENCES fixed_expenses (id),
  month TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (fixed_expense_id, month)
);
