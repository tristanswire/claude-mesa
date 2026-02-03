-- Migration: Create RPC function to increment AI actions used
-- This function atomically increments the ai_actions_used counter for a user.
-- Uses SECURITY DEFINER to bypass RLS since billing columns are protected.

CREATE OR REPLACE FUNCTION increment_ai_actions_used(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_preferences
  SET ai_actions_used = COALESCE(ai_actions_used, 0) + 1
  WHERE user_id = p_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_ai_actions_used(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION increment_ai_actions_used(UUID) IS
  'Atomically increments the ai_actions_used counter for a user. Uses SECURITY DEFINER to bypass RLS.';
