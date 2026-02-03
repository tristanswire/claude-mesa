-- ============================================================
-- Add first_name and last_name to user_preferences
-- ============================================================

-- Add name columns (nullable to support existing users and OAuth)
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Update the handle_new_user trigger to accept name data from auth metadata
-- Note: When signing up, names can be passed via auth.users.raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_preferences (
    user_id,
    first_name,
    last_name
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, user_preferences.first_name),
    last_name = COALESCE(EXCLUDED.last_name, user_preferences.last_name);
  RETURN NEW;
END;
$$;

-- Comment for documentation
COMMENT ON COLUMN user_preferences.first_name IS 'User first name, captured at signup';
COMMENT ON COLUMN user_preferences.last_name IS 'User last name, captured at signup';
