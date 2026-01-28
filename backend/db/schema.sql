-- VOTR Database Schema
-- PostgreSQL database schema for VOTR application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    auth_provider VARCHAR(50) CHECK (auth_provider IN ('anonymous', 'email', 'google', 'apple')),
    provider_id VARCHAR(255), -- OAuth provider user ID
    is_anonymous BOOLEAN DEFAULT true,
    is_email_verified BOOLEAN DEFAULT false,
    preferences JSONB DEFAULT '[]'::jsonb,
    location JSONB,
    gamification JSONB DEFAULT '{"points": 0, "streak": 0, "level": 1, "badges": []}'::jsonb,
    notification_preferences JSONB DEFAULT '{"electionReminders": true, "newCandidateAlerts": true, "earlyVotingAlerts": true, "daysBeforeElection": [7, 1]}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Indexes for authentication
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(auth_provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_users_anonymous ON users(is_anonymous);

-- Sessions table for JWT refresh tokens
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    device_info JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token);

-- Issues/Categories table
CREATE TABLE IF NOT EXISTS issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User preferences junction table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    importance INTEGER CHECK (importance >= 1 AND importance <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, issue_id)
);

-- Candidates table
CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    office VARCHAR(255) NOT NULL,
    office_level VARCHAR(50) CHECK (office_level IN ('federal', 'state', 'local')),
    party VARCHAR(100),
    photo_url TEXT,
    bio TEXT,
    district VARCHAR(100),
    state VARCHAR(2) NOT NULL,
    positions JSONB DEFAULT '[]'::jsonb,
    api_source VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Candidate sources table
CREATE TABLE IF NOT EXISTS candidate_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    source_type VARCHAR(50) CHECK (source_type IN ('social_media', 'news_article', 'official_website', 'voting_resource', 'other')),
    title VARCHAR(500),
    bias_score INTEGER CHECK (bias_score >= 0 AND bias_score <= 100),
    bias_tier VARCHAR(50) CHECK (bias_tier IN ('most_reliable', 'reliable', 'use_caution', 'highly_biased')),
    last_analyzed TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Swipes table
CREATE TABLE IF NOT EXISTS swipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    direction VARCHAR(10) CHECK (direction IN ('left', 'right', 'up')),
    match_score DECIMAL(5,2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, candidate_id, timestamp)
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_type VARCHAR(50) CHECK (badge_type IN ('informed_voter', 'local_expert', 'civic_champion', 'researcher', 'streak_master')),
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, badge_type)
);

-- Source feedback table
CREATE TABLE IF NOT EXISTS source_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES candidate_sources(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feedback_type VARCHAR(50) CHECK (feedback_type IN ('bias_incorrect', 'source_broken', 'helpful', 'not_helpful')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bias analysis cache table
CREATE TABLE IF NOT EXISTS bias_analysis_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url_hash VARCHAR(64) NOT NULL UNIQUE,
    bias_score INTEGER CHECK (bias_score >= 0 AND bias_score <= 100),
    bias_tier VARCHAR(50) CHECK (bias_tier IN ('most_reliable', 'reliable', 'use_caution', 'highly_biased')),
    analysis_data JSONB,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Elections table
CREATE TABLE IF NOT EXISTS elections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    type VARCHAR(50) CHECK (type IN ('primary', 'general', 'special', 'runoff')),
    offices JSONB DEFAULT '[]'::jsonb,
    district VARCHAR(100),
    state VARCHAR(2) NOT NULL,
    early_voting_start DATE,
    early_voting_end DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User locations table (for location tracking)
CREATE TABLE IF NOT EXISTS user_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT,
    district VARCHAR(100),
    state VARCHAR(2) NOT NULL,
    zip_code VARCHAR(10),
    is_primary BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_candidates_state ON candidates(state);
CREATE INDEX IF NOT EXISTS idx_candidates_office ON candidates(office);
CREATE INDEX IF NOT EXISTS idx_candidate_sources_candidate_id ON candidate_sources(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_sources_bias_score ON candidate_sources(bias_score);
CREATE INDEX IF NOT EXISTS idx_swipes_user_id ON swipes(user_id);
CREATE INDEX IF NOT EXISTS idx_swipes_candidate_id ON swipes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_swipes_timestamp ON swipes(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_bias_analysis_url_hash ON bias_analysis_cache(url_hash);
CREATE INDEX IF NOT EXISTS idx_elections_date ON elections(date);
CREATE INDEX IF NOT EXISTS idx_elections_state ON elections(state);
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);

