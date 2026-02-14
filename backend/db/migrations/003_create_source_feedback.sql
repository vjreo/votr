-- Migration 003: Create source_feedback table
-- This table stores user feedback on candidate sources

CREATE TABLE IF NOT EXISTS source_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES candidate_sources(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feedback_type VARCHAR(50) CHECK (feedback_type IN ('bias_incorrect', 'source_broken', 'helpful', 'not_helpful')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for source_feedback
CREATE INDEX IF NOT EXISTS idx_source_feedback_source_id ON source_feedback(source_id);
CREATE INDEX IF NOT EXISTS idx_source_feedback_user_id ON source_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_source_feedback_feedback_type ON source_feedback(feedback_type);
