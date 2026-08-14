-- Adds category archiving (Phase 2 Settings category management).
-- Never edit this file after it ships — add a new numbered migration instead.

ALTER TABLE categories ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0, 1));
