-- Migration: Add career column and state_legislature to office_level
-- Run: psql votr -f backend/db/migrations/005_add_career_and_office_level.sql

-- Add career JSONB column to candidates (array of {title, period, description})
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS career JSONB DEFAULT '[]'::jsonb;

-- Drop existing CHECK constraint on office_level (PostgreSQL doesn't support modifying)
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_office_level_check;

-- Add new CHECK constraint including state_legislature
ALTER TABLE candidates ADD CONSTRAINT candidates_office_level_check 
  CHECK (office_level IN ('federal', 'state', 'state_legislature', 'local'));
