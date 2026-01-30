-- ============================================================
-- USER ENTITLEMENTS - Plan gating and usage limits
-- ============================================================
-- Run this in Supabase SQL Editor after 0001_init.sql
-- ============================================================

-- ============================================================
-- TABLE: user_entitlements
-- ============================================================
CREATE TABLE user_entitlements (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Plan type
  plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'plus', 'ai')),

  -- Recipe limit (null = unlimited)
  recipe_limit INTEGER DEFAULT 25,

  -- AI actions limit (null = unlimited, 0 = not allowed)
  ai_actions_limit INTEGER DEFAULT 0,

  -- AI actions used this billing period
  ai_actions_used INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient lookups
CREATE INDEX idx_user_entitlements_plan ON user_entitlements(plan);

-- Apply updated_at trigger
CREATE TRIGGER update_user_entitlements_updated_at
  BEFORE UPDATE ON user_entitlements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- AUTO-CREATE ENTITLEMENTS ON SIGNUP
-- ============================================================
-- Update the handle_new_user function to also create entitlements
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create user preferences
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Create user entitlements with free plan defaults
  INSERT INTO public.user_entitlements (user_id, plan, recipe_limit, ai_actions_limit)
  VALUES (NEW.id, 'free', 25, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE user_entitlements ENABLE ROW LEVEL SECURITY;

-- Users can view their own entitlements
CREATE POLICY "Users can view own entitlements"
  ON user_entitlements FOR SELECT
  USING (auth.uid() = user_id);

-- Users cannot insert entitlements (created by trigger)
-- No INSERT policy = blocked by default

-- Users cannot update their own plan/limits (server-controlled)
-- They can only update ai_actions_used if we want to track from client
-- For now, no UPDATE policy = server-only via service role
-- No UPDATE policy = blocked by default

-- Users cannot delete entitlements
-- No DELETE policy = blocked by default

-- ============================================================
-- HELPER FUNCTION: Get recipe count for user
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_recipe_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COUNT(*)::INTEGER FROM recipes WHERE user_id = p_user_id;
$$;

-- ============================================================
-- COMMENTS
-- ============================================================
COMMENT ON TABLE user_entitlements IS 'User subscription plans and usage limits';
COMMENT ON COLUMN user_entitlements.plan IS 'Subscription tier: free, plus, or ai';
COMMENT ON COLUMN user_entitlements.recipe_limit IS 'Maximum recipes allowed. NULL = unlimited';
COMMENT ON COLUMN user_entitlements.ai_actions_limit IS 'AI actions per billing period. NULL = unlimited, 0 = not allowed';
COMMENT ON COLUMN user_entitlements.ai_actions_used IS 'AI actions consumed this billing period';

-- ============================================================
-- BACKFILL: Create entitlements for existing users
-- ============================================================
-- This safely creates entitlements for any existing users
INSERT INTO user_entitlements (user_id, plan, recipe_limit, ai_actions_limit)
SELECT id, 'free', 25, 0
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_entitlements)
ON CONFLICT (user_id) DO NOTHING;
