-- Superset grouping for active sessions (copied from plan at session start)
ALTER TABLE session_exercises
  ADD COLUMN IF NOT EXISTS superset_group_id INTEGER;
