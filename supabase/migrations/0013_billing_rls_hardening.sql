-- ============================================================
-- Billing DB + RLS Hardening for user_preferences
-- ============================================================
-- Goals:
-- 1. Ensure user_preferences has all billing/entitlement columns
-- 2. Prevent users from updating billing columns (plan tampering)
-- 3. Provide a safe function for updating allowed preferences
-- ============================================================

-- ============================================================
-- 1. ADD MISSING COLUMNS (idempotent)
-- ============================================================

-- Plan column with check constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_preferences'
    AND column_name = 'plan'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN plan TEXT NOT NULL DEFAULT 'free';
  END IF;
END $$;

-- Add/replace check constraint for plan values
ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS user_preferences_plan_check;
ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_plan_check
  CHECK (plan IN ('free', 'plus', 'ai'));

-- Recipe limit (null = unlimited)
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS recipe_limit INTEGER DEFAULT 25;

-- AI actions limit (null = unlimited, 0 = not allowed)
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS ai_actions_limit INTEGER DEFAULT 0;

-- AI actions used this billing period
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS ai_actions_used INTEGER NOT NULL DEFAULT 0;

-- plan_status (should exist from 0010, but ensure it does)
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'active';

-- Re-add check constraint for plan_status (idempotent)
ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS user_preferences_plan_status_check;
ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_plan_status_check
  CHECK (plan_status IS NULL OR plan_status IN ('active', 'trialing', 'past_due', 'canceled', 'inactive'));

-- Stripe IDs (should exist from 0010, but ensure they do)
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- NEW: Grace period tracking for past_due subscriptions
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS past_due_since TIMESTAMPTZ;

-- ============================================================
-- 2. INDEXES FOR WEBHOOK LOOKUPS (idempotent)
-- ============================================================

-- Index on stripe_customer_id for webhook customer.* events
CREATE INDEX IF NOT EXISTS idx_user_preferences_stripe_customer
  ON user_preferences(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- Index on stripe_subscription_id for webhook subscription.* events
CREATE INDEX IF NOT EXISTS idx_user_preferences_stripe_subscription
  ON user_preferences(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- Index on plan for analytics/admin queries
CREATE INDEX IF NOT EXISTS idx_user_preferences_plan
  ON user_preferences(plan);

-- ============================================================
-- 3. RLS HARDENING
-- ============================================================
-- Strategy: Remove direct UPDATE policy, provide security definer function
-- for updating allowed columns only.

-- Ensure RLS is enabled
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Keep SELECT policy (users can view their own preferences)
-- This should already exist from 0001_init.sql, but ensure it does
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

-- REMOVE the broad UPDATE policy that allows updating any column
-- This is the key security fix - prevents plan tampering
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;

-- No INSERT policy needed (rows created by trigger on signup)
-- No DELETE policy needed (cascade on user delete)

-- ============================================================
-- 4. SECURITY DEFINER FUNCTION FOR SAFE PREFERENCE UPDATES
-- ============================================================
-- This function allows users to update ONLY safe columns:
-- - preferred_unit_system
-- - theme (if exists)
--
-- Billing columns (plan, plan_status, stripe_*, limits) are
-- intentionally NOT updatable through this function.
-- Those can only be updated via service role (webhooks/admin).

CREATE OR REPLACE FUNCTION public.update_user_preferences(
  p_preferred_unit_system TEXT DEFAULT NULL,
  p_theme_preference TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_result user_preferences%ROWTYPE;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate inputs if provided
  IF p_preferred_unit_system IS NOT NULL THEN
    IF p_preferred_unit_system NOT IN ('imperial', 'metric', 'original') THEN
      RAISE EXCEPTION 'Invalid unit system: %. Must be imperial, metric, or original', p_preferred_unit_system;
    END IF;
  END IF;

  IF p_theme_preference IS NOT NULL THEN
    IF p_theme_preference NOT IN ('system', 'light', 'dark') THEN
      RAISE EXCEPTION 'Invalid theme: %. Must be system, light, or dark', p_theme_preference;
    END IF;
  END IF;

  -- Upsert with only the provided fields
  INSERT INTO user_preferences (user_id, preferred_unit_system, theme_preference)
  VALUES (
    v_user_id,
    COALESCE(p_preferred_unit_system, 'original'),
    COALESCE(p_theme_preference, 'system')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    preferred_unit_system = COALESCE(p_preferred_unit_system, user_preferences.preferred_unit_system),
    theme_preference = COALESCE(p_theme_preference, user_preferences.theme_preference),
    updated_at = NOW()
  RETURNING * INTO v_result;

  -- Return updated row as JSONB
  RETURN jsonb_build_object(
    'user_id', v_result.user_id,
    'preferred_unit_system', v_result.preferred_unit_system,
    'theme_preference', v_result.theme_preference
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.update_user_preferences(TEXT, TEXT) TO authenticated;

-- ============================================================
-- 5. UPDATE HANDLE_NEW_USER TO SET ENTITLEMENTS
-- ============================================================
-- Ensure new users get default entitlement values in user_preferences

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create user preferences with default entitlements
  INSERT INTO public.user_preferences (
    user_id,
    plan,
    recipe_limit,
    ai_actions_limit,
    ai_actions_used
  )
  VALUES (
    NEW.id,
    'free',
    25,
    0,
    0
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Also create user_entitlements for backwards compatibility
  -- (can be removed once fully migrated)
  INSERT INTO public.user_entitlements (user_id, plan, recipe_limit, ai_actions_limit)
  VALUES (NEW.id, 'free', 25, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ============================================================
-- 6. BACKFILL EXISTING USERS
-- ============================================================
-- Set default values for existing users who don't have them

UPDATE user_preferences
SET
  plan = COALESCE(plan, 'free'),
  recipe_limit = COALESCE(recipe_limit, 25),
  ai_actions_limit = COALESCE(ai_actions_limit, 0),
  ai_actions_used = COALESCE(ai_actions_used, 0)
WHERE plan IS NULL OR recipe_limit IS NULL;

-- ============================================================
-- 7. COMMENTS
-- ============================================================
COMMENT ON COLUMN user_preferences.plan IS 'Subscription tier: free, plus, or ai. Server-controlled only.';
COMMENT ON COLUMN user_preferences.plan_status IS 'Subscription status: active, trialing, past_due, canceled, inactive';
COMMENT ON COLUMN user_preferences.recipe_limit IS 'Maximum recipes allowed. NULL = unlimited. Server-controlled.';
COMMENT ON COLUMN user_preferences.ai_actions_limit IS 'AI actions per billing period. NULL = unlimited, 0 = not allowed';
COMMENT ON COLUMN user_preferences.ai_actions_used IS 'AI actions consumed this billing period. Server-controlled.';
COMMENT ON COLUMN user_preferences.stripe_customer_id IS 'Stripe Customer ID (cus_xxx). Server-controlled.';
COMMENT ON COLUMN user_preferences.stripe_subscription_id IS 'Stripe Subscription ID (sub_xxx). Server-controlled.';
COMMENT ON COLUMN user_preferences.current_period_end IS 'End of current billing period. Server-controlled.';
COMMENT ON COLUMN user_preferences.past_due_since IS 'When subscription entered past_due status. For grace period tracking.';

COMMENT ON FUNCTION public.update_user_preferences(TEXT, TEXT) IS
'Safe function for users to update their preferences. Only allows updating:
- preferred_unit_system (imperial, metric, original)
- theme_preference (system, light, dark)
Billing fields (plan, limits, stripe IDs) can ONLY be updated via service role.';

-- ============================================================
-- 8. RELOAD SCHEMA CACHE
-- ============================================================
SELECT pg_notify('pgrst', 'reload schema');

-- ============================================================
-- SUMMARY: RLS POLICY STATE AFTER THIS MIGRATION
-- ============================================================
--
-- user_preferences:
--   SELECT: Users can view their own row ✓
--   INSERT: No policy (created by trigger) ✓
--   UPDATE: No policy (use update_user_preferences function) ✓
--   DELETE: No policy (cascade on user delete) ✓
--
-- Safe columns (updatable via function):
--   - preferred_unit_system
--   - theme
--
-- Protected columns (service role only):
--   - plan
--   - plan_status
--   - recipe_limit
--   - ai_actions_limit
--   - ai_actions_used
--   - stripe_customer_id
--   - stripe_subscription_id
--   - current_period_end
--   - past_due_since
--
-- HOW TO UPDATE PREFERENCES FROM APP CODE:
-- ============================================================
-- Instead of:
--   supabase.from('user_preferences').update({ theme_preference: 'dark' })
--
-- Use:
--   supabase.rpc('update_user_preferences', {
--     p_preferred_unit_system: 'metric',  // optional
--     p_theme_preference: 'dark'          // optional
--   })
--
-- Returns JSONB with updated values:
--   { user_id, preferred_unit_system, theme_preference }
--
-- For billing updates (webhooks), use service role client:
--   const adminClient = createClient(url, serviceRoleKey);
--   adminClient.from('user_preferences').update({ plan: 'plus', ... })
-- ============================================================
