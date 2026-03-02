-- Migration 004: Create user_roster table for syncing saved candidates
CREATE TABLE IF NOT EXISTS user_roster (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roster_user_id ON user_roster(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roster_candidate_id ON user_roster(candidate_id);
