-- Migration: Add state configuration tables and indexes
-- Date: 2026-01-29
-- Description: Adds state_config and state_data_sources tables for multi-state support
--              Adds composite indexes for improved query performance

-- State configuration table (for state-specific settings)
CREATE TABLE IF NOT EXISTS state_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state_code VARCHAR(2) NOT NULL,
    config_key VARCHAR(255) NOT NULL,
    config_value JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(state_code, config_key)
);

-- State data sources table (for preferred data sources per state)
CREATE TABLE IF NOT EXISTS state_data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state_code VARCHAR(2) NOT NULL,
    source_type VARCHAR(100) NOT NULL,
    source_config JSONB,
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(state_code, source_type)
);

-- Add unique constraints to existing tables for upsert support
DO $$
BEGIN
    -- Add unique constraint to elections table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'elections_name_date_state_district_key'
    ) THEN
        ALTER TABLE elections 
        ADD CONSTRAINT elections_name_date_state_district_key 
        UNIQUE(name, date, state, COALESCE(district, ''));
    END IF;

    -- Add unique constraint to candidates table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'candidates_name_office_state_district_key'
    ) THEN
        ALTER TABLE candidates 
        ADD CONSTRAINT candidates_name_office_state_district_key 
        UNIQUE(name, office, state, COALESCE(district, ''));
    END IF;
END $$;

-- Composite indexes for state-based queries
CREATE INDEX IF NOT EXISTS idx_elections_state_date ON elections(state, date);
CREATE INDEX IF NOT EXISTS idx_elections_state_district ON elections(state, district) WHERE district IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_candidates_state_office_level ON candidates(state, office_level);
CREATE INDEX IF NOT EXISTS idx_candidates_state_office ON candidates(state, office);

-- Indexes for state configuration tables
CREATE INDEX IF NOT EXISTS idx_state_config_state_code ON state_config(state_code);
CREATE INDEX IF NOT EXISTS idx_state_data_sources_state_code ON state_data_sources(state_code);
CREATE INDEX IF NOT EXISTS idx_state_data_sources_priority ON state_data_sources(state_code, priority);
