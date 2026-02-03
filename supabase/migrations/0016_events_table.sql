-- Migration: Create events table for lightweight analytics
-- Purpose: Track key product events for activation and retention metrics

-- ============================================================
-- 1. CREATE EVENTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. INDEXES
-- ============================================================

-- Index for querying user's events
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);

-- Index for querying by event name (for analytics queries)
CREATE INDEX IF NOT EXISTS idx_events_event_name ON public.events(event_name);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at);

-- Composite index for user + event name queries
CREATE INDEX IF NOT EXISTS idx_events_user_event ON public.events(user_id, event_name);

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own events
CREATE POLICY "Users can insert own events"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own events (optional, for debugging)
CREATE POLICY "Users can view own events"
  ON public.events FOR SELECT
  USING (auth.uid() = user_id);

-- No UPDATE or DELETE policies - events are immutable

-- ============================================================
-- 4. COMMENTS
-- ============================================================

COMMENT ON TABLE public.events IS 'Lightweight product analytics events for tracking user activation and retention';
COMMENT ON COLUMN public.events.event_name IS 'Event identifier, e.g., recipe_created, onboarding_completed';
COMMENT ON COLUMN public.events.metadata IS 'Optional JSON metadata for the event';

-- ============================================================
-- 5. RELOAD SCHEMA CACHE
-- ============================================================

SELECT pg_notify('pgrst', 'reload schema');
