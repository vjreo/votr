-- Ballot Measures table (amendments, bonds, referendums)
CREATE TABLE IF NOT EXISTS ballot_measures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    measure_id VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('amendment', 'bond', 'referendum', 'initiative')),
    title VARCHAR(500) NOT NULL,
    short_title VARCHAR(200),
    ballot_question TEXT NOT NULL,
    official_summary TEXT,
    explanation TEXT,
    source_law VARCHAR(255),
    choices JSONB DEFAULT '["Yes", "No"]'::jsonb,
    state VARCHAR(2) NOT NULL,
    county VARCHAR(100),
    city VARCHAR(100),
    election_date DATE NOT NULL,
    principal DECIMAL(15, 2),
    estimated_cost DECIMAL(15, 2),
    estimated_tax_impact VARCHAR(255),
    sources JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ballot_measures_state ON ballot_measures(state);
CREATE INDEX IF NOT EXISTS idx_ballot_measures_election_date ON ballot_measures(election_date);
CREATE INDEX IF NOT EXISTS idx_ballot_measures_county ON ballot_measures(county);
CREATE INDEX IF NOT EXISTS idx_ballot_measures_type ON ballot_measures(type);
