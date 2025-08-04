-- Migration: Add planetary_snapshot and planetary_aspects columns to world_events
-- This migration adds the new columns needed to store planetary data directly in world_events table
-- eliminating the need for separate planetary_transits and planetary_aspects tables

-- Step 1: Add the new columns to world_events table
ALTER TABLE world_events 
ADD COLUMN IF NOT EXISTS planetary_snapshot JSONB,
ADD COLUMN IF NOT EXISTS planetary_aspects TEXT[];

-- Step 2: Add indexes for the new columns to improve query performance
CREATE INDEX IF NOT EXISTS idx_world_events_planetary_snapshot ON world_events USING GIN (planetary_snapshot);
CREATE INDEX IF NOT EXISTS idx_world_events_planetary_aspects ON world_events USING GIN (planetary_aspects);

-- Step 3: Add comments to document the new columns
COMMENT ON COLUMN world_events.planetary_snapshot IS 'Complete planetary data snapshot in JSON format containing all planetary positions, signs, degrees, nakshatras, ascendant, etc.';
COMMENT ON COLUMN world_events.planetary_aspects IS 'Array of major planetary aspects like "Mars square Saturn", "Sun conjunct Jupiter"';

-- Step 4: Update the updated_at trigger to include the new columns
-- (The existing trigger should automatically handle this, but we ensure it's working)
DROP TRIGGER IF EXISTS update_world_events_updated_at ON world_events;
CREATE TRIGGER update_world_events_updated_at 
    BEFORE UPDATE ON world_events 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
