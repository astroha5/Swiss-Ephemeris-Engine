-- Add planetary_snapshot and planetary_aspects columns to world_events table
-- Execute this script in Supabase SQL Editor

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

-- Step 4: Verify the columns were added (optional - run separately to check)
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns 
-- WHERE table_name = 'world_events' 
-- AND column_name IN ('planetary_snapshot', 'planetary_aspects')
-- ORDER BY column_name;
