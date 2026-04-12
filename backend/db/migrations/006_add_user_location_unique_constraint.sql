-- Migration 006: Add unique constraint on user_locations(user_id, state)
-- Required for the ON CONFLICT upsert in POST /api/users/:id/location.
-- Safe to run multiple times (IF NOT EXISTS guard on index).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_locations_user_id_state_key'
      AND conrelid = 'user_locations'::regclass
  ) THEN
    ALTER TABLE user_locations
      ADD CONSTRAINT user_locations_user_id_state_key UNIQUE (user_id, state);
  END IF;
END;
$$;
