-- Migration: Add planetary_snapshot table to store precomputed planetary data
-- This table will store a single snapshot of all planetary positions for each event
-- to avoid recomputing the same data multiple times

CREATE TABLE IF NOT EXISTS planetary_snapshot (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES world_events(id) ON DELETE CASCADE,
    
    -- Calculation details
    julian_day DECIMAL(15, 8) NOT NULL,
    calculation_location_lat DECIMAL(10, 8) NOT NULL,
    calculation_location_lon DECIMAL(11, 8) NOT NULL,
    timezone TEXT DEFAULT 'UTC',
    
    -- Complete planetary snapshot in JSON format
    -- This will contain all planets, signs, degrees, nakshatras, etc.
    planetary_data JSONB NOT NULL,
    
    -- Quick access fields for common queries (duplicated from JSON for indexing)
    sun_sign TEXT,
    moon_sign TEXT,
    mars_sign TEXT,
    jupiter_sign TEXT,
    saturn_sign TEXT,
    ascendant_sign TEXT,
    
    -- Aspects summary
    major_aspects_count INTEGER DEFAULT 0,
    exact_aspects_count INTEGER DEFAULT 0,
    
    -- Calculation metadata
    calculation_engine TEXT DEFAULT 'swiss_ephemeris',
    calculation_version TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one snapshot per event
    UNIQUE(event_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_planetary_snapshot_event_id ON planetary_snapshot(event_id);
CREATE INDEX IF NOT EXISTS idx_planetary_snapshot_sun_sign ON planetary_snapshot(sun_sign);
CREATE INDEX IF NOT EXISTS idx_planetary_snapshot_moon_sign ON planetary_snapshot(moon_sign);
CREATE INDEX IF NOT EXISTS idx_planetary_snapshot_mars_sign ON planetary_snapshot(mars_sign);
CREATE INDEX IF NOT EXISTS idx_planetary_snapshot_jupiter_sign ON planetary_snapshot(jupiter_sign);
CREATE INDEX IF NOT EXISTS idx_planetary_snapshot_saturn_sign ON planetary_snapshot(saturn_sign);
CREATE INDEX IF NOT EXISTS idx_planetary_snapshot_julian_day ON planetary_snapshot(julian_day);

-- Create updated trigger
CREATE TRIGGER update_planetary_snapshot_updated_at 
    BEFORE UPDATE ON planetary_snapshot 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Update the events_with_transits view to include planetary_snapshot data
CREATE OR REPLACE VIEW events_with_transits AS
SELECT 
    e.*,
    COALESCE(p.sun_sign, ps.sun_sign) as sun_sign,
    COALESCE(p.sun_degree_in_sign, (ps.planetary_data->'sun'->>'degree_in_sign')::DECIMAL) as sun_degree_in_sign,
    COALESCE(p.moon_sign, ps.moon_sign) as moon_sign,
    COALESCE(p.moon_degree_in_sign, (ps.planetary_data->'moon'->>'degree_in_sign')::DECIMAL) as moon_degree_in_sign,
    COALESCE(p.mars_sign, ps.mars_sign) as mars_sign,
    COALESCE(p.jupiter_sign, ps.jupiter_sign) as jupiter_sign,
    COALESCE(p.saturn_sign, ps.saturn_sign) as saturn_sign,
    COALESCE(p.ascendant_sign, ps.ascendant_sign) as ascendant_sign,
    COALESCE(p.julian_day, ps.julian_day) as julian_day,
    ps.planetary_data,
    ps.major_aspects_count,
    ps.exact_aspects_count,
    -- Check if we have planetary data from either source
    CASE 
        WHEN ps.event_id IS NOT NULL OR p.event_id IS NOT NULL THEN true 
        ELSE false 
    END as has_planetary_data
FROM world_events e
LEFT JOIN planetary_transits p ON e.id = p.event_id
LEFT JOIN planetary_snapshot ps ON e.id = ps.event_id;

COMMENT ON TABLE planetary_snapshot IS 'Stores precomputed planetary snapshots for world events to avoid recalculation';
COMMENT ON COLUMN planetary_snapshot.planetary_data IS 'Complete JSON snapshot of all planetary positions, signs, degrees, nakshatras, and aspects';
COMMENT ON COLUMN planetary_snapshot.event_id IS 'Foreign key to world_events table';
COMMENT ON COLUMN planetary_snapshot.julian_day IS 'Julian day number for the calculation';
