-- Migration: Add onboarding_completed flag to user_preferences
-- Purpose: Track whether user has completed the onboarding flow

-- ============================================================
-- 1. ADD ONBOARDING_COMPLETED COLUMN
-- ============================================================

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- ============================================================
-- 2. UPDATE SECURITY DEFINER FUNCTION TO ALLOW SETTING FLAG
-- ============================================================
-- Extend update_user_preferences to accept p_onboarding_completed parameter

CREATE OR REPLACE FUNCTION public.update_user_preferences(
  p_preferred_unit_system TEXT DEFAULT NULL,
  p_theme_preference TEXT DEFAULT NULL,
  p_onboarding_completed BOOLEAN DEFAULT NULL
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
  INSERT INTO user_preferences (user_id, preferred_unit_system, theme_preference, onboarding_completed)
  VALUES (
    v_user_id,
    COALESCE(p_preferred_unit_system, 'original'),
    COALESCE(p_theme_preference, 'system'),
    COALESCE(p_onboarding_completed, false)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    preferred_unit_system = COALESCE(p_preferred_unit_system, user_preferences.preferred_unit_system),
    theme_preference = COALESCE(p_theme_preference, user_preferences.theme_preference),
    onboarding_completed = COALESCE(p_onboarding_completed, user_preferences.onboarding_completed),
    updated_at = NOW()
  RETURNING * INTO v_result;

  -- Return updated row as JSONB
  RETURN jsonb_build_object(
    'user_id', v_result.user_id,
    'preferred_unit_system', v_result.preferred_unit_system,
    'theme_preference', v_result.theme_preference,
    'onboarding_completed', v_result.onboarding_completed
  );
END;
$$;

-- Grant execute to authenticated users (may already exist but safe to re-run)
GRANT EXECUTE ON FUNCTION public.update_user_preferences(TEXT, TEXT, BOOLEAN) TO authenticated;

-- ============================================================
-- 3. UPDATE HANDLE_NEW_USER TRIGGER
-- ============================================================
-- Ensure new users have onboarding_completed = false

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
    ai_actions_used,
    onboarding_completed
  )
  VALUES (
    NEW.id,
    'free',
    25,
    0,
    0,
    false
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
-- 4. COMMENTS
-- ============================================================

COMMENT ON COLUMN user_preferences.onboarding_completed IS
  'Whether user has completed the onboarding flow. Set to true on skip or completion.';

-- ============================================================
-- 5. RELOAD SCHEMA CACHE
-- ============================================================

SELECT pg_notify('pgrst', 'reload schema');
