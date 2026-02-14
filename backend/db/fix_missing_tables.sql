-- Fix missing tables: candidates, candidate_sources, elections, swipes

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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, office, state, COALESCE(district, ''))
);

-- Indexes for candidates
CREATE INDEX IF NOT EXISTS idx_candidates_state ON candidates(state);
CREATE INDEX IF NOT EXISTS idx_candidates_office ON candidates(office);
CREATE INDEX IF NOT EXISTS idx_candidates_state_office_level ON candidates(state, office_level);
CREATE INDEX IF NOT EXISTS idx_candidates_state_office ON candidates(state, office);

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

-- Indexes for candidate_sources
CREATE INDEX IF NOT EXISTS idx_candidate_sources_candidate_id ON candidate_sources(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_sources_bias_score ON candidate_sources(bias_score);

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

-- Indexes for swipes
CREATE INDEX IF NOT EXISTS idx_swipes_user_id ON swipes(user_id);
CREATE INDEX IF NOT EXISTS idx_swipes_candidate_id ON swipes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_swipes_timestamp ON swipes(timestamp);

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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, date, state, COALESCE(district, ''))
);

-- Indexes for elections
CREATE INDEX IF NOT EXISTS idx_elections_date ON elections(date);
CREATE INDEX IF NOT EXISTS idx_elections_state ON elections(state);
CREATE INDEX IF NOT EXISTS idx_elections_state_date ON elections(state, date);
CREATE INDEX IF NOT EXISTS idx_elections_state_district ON elections(state, district) WHERE district IS NOT NULL;
