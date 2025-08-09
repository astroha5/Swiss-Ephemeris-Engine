-- Add subscription columns to user_preferences for plan and premium period tracking
-- Safe to run multiple times

ALTER TABLE IF EXISTS public.user_preferences
  ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free';

ALTER TABLE IF EXISTS public.user_preferences
  ADD COLUMN IF NOT EXISTS premium_start_date timestamptz;

ALTER TABLE IF EXISTS public.user_preferences
  ADD COLUMN IF NOT EXISTS premium_end_date timestamptz;

-- Backfill plan from legacy subscription_plan if present
UPDATE public.user_preferences
SET plan = CASE WHEN subscription_plan = 'premium' THEN 'premium' ELSE 'free' END
WHERE plan IS NULL OR plan NOT IN ('free','premium');

-- Optional: simple check constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_preferences_plan_check'
  ) THEN
    ALTER TABLE public.user_preferences
      ADD CONSTRAINT user_preferences_plan_check CHECK (plan IN ('free','premium'));
  END IF;
END$$;


