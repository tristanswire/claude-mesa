-- Migration: Update handle_new_user() to support OAuth provider metadata
-- Purpose: Extract first/last name from Google (given_name/family_name)
--          and Apple (name) OAuth metadata into the profiles table.
--          Also restores the profiles INSERT that was dropped in migration 0015.

-- ============================================================
-- 1. UPDATE HANDLE_NEW_USER TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
  v_full_name TEXT;
BEGIN
  -- Create user_preferences with default entitlements
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

  -- Create user_entitlements for backwards compatibility
  INSERT INTO public.user_entitlements (user_id, plan, recipe_limit, ai_actions_limit)
  VALUES (NEW.id, 'free', 25, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Extract first name: email signup -> Google -> Apple (split full name)
  v_full_name := NEW.raw_user_meta_data->>'name';
  v_first_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'first_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'given_name', ''),
    NULLIF(split_part(COALESCE(v_full_name, ''), ' ', 1), '')
  );

  -- Extract last name: email signup -> Google -> Apple (split full name)
  v_last_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'last_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'family_name', ''),
    NULLIF(
      TRIM(substring(COALESCE(v_full_name, '') FROM position(' ' IN COALESCE(v_full_name, '')) + 1)),
      ''
    )
  );

  -- Create profile row with extracted name
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name
  )
  VALUES (
    NEW.id,
    v_first_name,
    v_last_name
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name);

  RETURN NEW;
END;
$$;

-- ============================================================
-- 2. RELOAD SCHEMA CACHE
-- ============================================================

SELECT pg_notify('pgrst', 'reload schema');
