-- =====================================
-- TABLE: event_pattern_matches
-- =====================================
-- This table links events to pattern occurrences for ML training

CREATE TABLE IF NOT EXISTS event_pattern_matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES world_events(id) ON DELETE CASCADE,
    pattern_id UUID NOT NULL REFERENCES astrological_patterns(id) ON DELETE CASCADE,
    
    -- Match quality metrics
    match_strength DECIMAL(5, 2) NOT NULL CHECK (match_strength >= 0 AND match_strength <= 100), -- 0-100 how closely the pattern matches
    exactness BOOLEAN DEFAULT FALSE, -- Whether it's an exact match within tight orbs
    orb_applied DECIMAL(6, 2), -- The actual orb that was applied for this match
    
    -- Match details for analysis
    match_details JSONB, -- Specific details about what matched (planets, degrees, etc.)
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure no duplicate matches
    UNIQUE(event_id, pattern_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_pattern_matches_event_id ON event_pattern_matches(event_id);
CREATE INDEX IF NOT EXISTS idx_event_pattern_matches_pattern_id ON event_pattern_matches(pattern_id);
CREATE INDEX IF NOT EXISTS idx_event_pattern_matches_strength ON event_pattern_matches(match_strength DESC);
CREATE INDEX IF NOT EXISTS idx_event_pattern_matches_exactness ON event_pattern_matches(exactness) WHERE exactness = true;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_event_pattern_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_event_pattern_matches_updated_at 
    BEFORE UPDATE ON event_pattern_matches 
    FOR EACH ROW 
    EXECUTE FUNCTION update_event_pattern_matches_updated_at();

-- Useful view: Events with their pattern matches
CREATE OR REPLACE VIEW events_with_pattern_matches AS
SELECT 
    e.id as event_id,
    e.title,
    e.event_date,
    e.category,
    e.event_type,
    e.impact_level,
    e.planetary_snapshot,
    ap.id as pattern_id,
    ap.pattern_name,
    ap.pattern_type,
    ap.pattern_conditions,
    epm.match_strength,
    epm.exactness,
    epm.orb_applied,
    epm.match_details
FROM world_events e
JOIN event_pattern_matches epm ON e.id = epm.event_id
JOIN astrological_patterns ap ON epm.pattern_id = ap.id
ORDER BY e.event_date DESC, epm.match_strength DESC;
