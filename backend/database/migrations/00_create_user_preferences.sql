-- Create user_preferences table if it doesn't exist

CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_address text,
  email_notifications boolean DEFAULT true,
  webhook_notifications boolean DEFAULT false,
  min_risk_threshold text DEFAULT 'MEDIUM',
  notification_advance_days integer DEFAULT 7,
  monitor_financial boolean DEFAULT true,
  monitor_political boolean DEFAULT true,
  monitor_natural_disasters boolean DEFAULT true,
  monitor_wars boolean DEFAULT true,
  monitor_pandemics boolean DEFAULT true,
  preferred_pattern_types text[] DEFAULT ARRAY['aspect_pattern','degree_specific','combined_pattern'],
  timezone text,
  -- Legacy plan column used previously in code
  subscription_plan text,
  -- New subscription model
  plan text DEFAULT 'free',
  premium_start_date timestamptz,
  premium_end_date timestamptz
);

-- Enable RLS so users can access only their own row
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: users can select their own preferences
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_preferences' AND policyname='user_prefs_select_own'
  ) THEN
    CREATE POLICY user_prefs_select_own ON public.user_preferences
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END$$;

-- Policy: users can insert their own row
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_preferences' AND policyname='user_prefs_insert_own'
  ) THEN
    CREATE POLICY user_prefs_insert_own ON public.user_preferences
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- Policy: users can update their own row
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_preferences' AND policyname='user_prefs_update_own'
  ) THEN
    CREATE POLICY user_prefs_update_own ON public.user_preferences
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;


