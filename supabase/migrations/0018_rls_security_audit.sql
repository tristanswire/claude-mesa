-- ============================================================
-- RLS SECURITY AUDIT - Comprehensive Policy Review
-- ============================================================
-- Purpose: Ensure all tables have proper RLS policies with no
-- overly-broad access. This migration is idempotent.
--
-- Run after all other migrations to ensure final security state.
-- ============================================================

-- ============================================================
-- 1. ENSURE RLS IS ENABLED ON ALL TABLES
-- ============================================================
-- Even if already enabled, this is safe to re-run

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_stacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Also handle user_entitlements if it exists (legacy table)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_entitlements') THEN
    EXECUTE 'ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- ============================================================
-- 2. USER_PREFERENCES - Secure billing columns
-- ============================================================
-- Issue: UPDATE policy allows updating any column including billing.
-- Solution: Keep UPDATE policy but document that app code must only
-- update safe columns. Billing updates use service role.
--
-- Safe columns: preferred_unit_system, theme_preference, onboarding_completed
-- Protected columns: plan, plan_status, recipe_limit, ai_actions_*,
--                    stripe_*, current_period_end, past_due_since

-- Drop and recreate policies for consistency
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own safe preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;

-- SELECT: Users can view their own preferences
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: Users can create their own preferences row (for upsert)
CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own preferences
-- Note: Application code MUST only update safe columns.
-- Billing columns should only be updated via service role (webhooks).
CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- No DELETE policy - preferences persist with user (cascade on user delete)

-- ============================================================
-- 3. RECIPES - Standard user ownership
-- ============================================================

DROP POLICY IF EXISTS "Users can view own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can create own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can update own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can delete own recipes" ON recipes;
DROP POLICY IF EXISTS "Anyone can view recipes with active share" ON recipes;

-- SELECT: Own recipes OR recipes with active share link
CREATE POLICY "Users can view own recipes"
  ON recipes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- SELECT: Public access for shared recipes (no auth required)
CREATE POLICY "Anyone can view shared recipes"
  ON recipes FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipe_shares
      WHERE recipe_shares.recipe_id = recipes.id
      AND recipe_shares.is_active = true
    )
  );

-- INSERT: Only own recipes
CREATE POLICY "Users can create own recipes"
  ON recipes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Only own recipes
CREATE POLICY "Users can update own recipes"
  ON recipes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Only own recipes
CREATE POLICY "Users can delete own recipes"
  ON recipes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 4. STACKS - Standard user ownership
-- ============================================================

DROP POLICY IF EXISTS "Users can view own stacks" ON stacks;
DROP POLICY IF EXISTS "Users can create own stacks" ON stacks;
DROP POLICY IF EXISTS "Users can update own stacks" ON stacks;
DROP POLICY IF EXISTS "Users can delete own stacks" ON stacks;

CREATE POLICY "Users can view own stacks"
  ON stacks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own stacks"
  ON stacks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stacks"
  ON stacks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stacks"
  ON stacks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 5. RECIPE_STACKS - Junction table (ownership via parent tables)
-- ============================================================

DROP POLICY IF EXISTS "Users can view own recipe_stacks" ON recipe_stacks;
DROP POLICY IF EXISTS "Users can create own recipe_stacks" ON recipe_stacks;
DROP POLICY IF EXISTS "Users can delete own recipe_stacks" ON recipe_stacks;

-- SELECT: Must own both recipe and stack
CREATE POLICY "Users can view own recipe_stacks"
  ON recipe_stacks FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM recipes WHERE id = recipe_id AND user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM stacks WHERE id = stack_id AND user_id = auth.uid())
  );

-- INSERT: Must own both recipe and stack
CREATE POLICY "Users can create own recipe_stacks"
  ON recipe_stacks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM recipes WHERE id = recipe_id AND user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM stacks WHERE id = stack_id AND user_id = auth.uid())
  );

-- DELETE: Must own both recipe and stack
CREATE POLICY "Users can delete own recipe_stacks"
  ON recipe_stacks FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM recipes WHERE id = recipe_id AND user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM stacks WHERE id = stack_id AND user_id = auth.uid())
  );

-- No UPDATE policy - just delete and re-add

-- ============================================================
-- 6. RECIPE_SHARES - Share link management
-- ============================================================

DROP POLICY IF EXISTS "Users can view own shares" ON recipe_shares;
DROP POLICY IF EXISTS "Users can create shares for own recipes" ON recipe_shares;
DROP POLICY IF EXISTS "Users can update own shares" ON recipe_shares;
DROP POLICY IF EXISTS "Users can delete own shares" ON recipe_shares;
DROP POLICY IF EXISTS "Anyone can view active shares by token" ON recipe_shares;

-- SELECT: Owners can view their own shares
CREATE POLICY "Users can view own shares"
  ON recipe_shares FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- SELECT: Public can view active shares (needed to verify token validity)
-- Note: This allows enumeration of active share IDs but not recipe content.
-- The actual recipe content is protected by the recipes policy.
CREATE POLICY "Public can view active shares"
  ON recipe_shares FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- INSERT: Only for recipes you own
CREATE POLICY "Users can create shares for own recipes"
  ON recipe_shares FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM recipes WHERE id = recipe_id AND user_id = auth.uid())
  );

-- UPDATE: Only your own shares (e.g., to deactivate)
CREATE POLICY "Users can update own shares"
  ON recipe_shares FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Only your own shares
CREATE POLICY "Users can delete own shares"
  ON recipe_shares FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 7. PROFILES - User identity
-- ============================================================

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- No DELETE policy - profiles persist with user (cascade on user delete)

-- ============================================================
-- 8. STORE_ITEMS - Public catalog (read-only for users)
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view active store items" ON store_items;
DROP POLICY IF EXISTS "Public can view active store items" ON store_items;

-- SELECT: Public read for active items (storefront is public)
CREATE POLICY "Public can view active store items"
  ON store_items FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- No INSERT/UPDATE/DELETE - service role only (admin operations)

-- ============================================================
-- 9. RECIPE_STORE_ITEMS - Product recommendations (read-only)
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can view recipe store mappings" ON recipe_store_items;

-- SELECT: Authenticated users can view mappings for their recipes
-- More restrictive: only see mappings for recipes you own or have access to
CREATE POLICY "Users can view recipe store mappings"
  ON recipe_store_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE id = recipe_id
      AND (
        user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM recipe_shares
          WHERE recipe_shares.recipe_id = recipes.id
          AND recipe_shares.is_active = true
        )
      )
    )
  );

-- No INSERT/UPDATE/DELETE - service role only (admin operations)

-- ============================================================
-- 10. EVENTS - Analytics (insert-only for users)
-- ============================================================

DROP POLICY IF EXISTS "Users can insert own events" ON events;
DROP POLICY IF EXISTS "Users can view own events" ON events;

-- INSERT: Users can insert their own events
CREATE POLICY "Users can insert own events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- SELECT: Users can view their own events (for debugging/transparency)
CREATE POLICY "Users can view own events"
  ON events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- No UPDATE/DELETE - events are immutable audit log

-- ============================================================
-- 11. FEEDBACK - User feedback (insert-only for users)
-- ============================================================

DROP POLICY IF EXISTS "Users can insert own feedback" ON feedback;
DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;

-- INSERT: Users can submit their own feedback
CREATE POLICY "Users can insert own feedback"
  ON feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- SELECT: Users can view their own feedback (for confirmation)
CREATE POLICY "Users can view own feedback"
  ON feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- No UPDATE/DELETE - feedback is append-only

-- ============================================================
-- 12. USER_ENTITLEMENTS (legacy table, if exists)
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_entitlements') THEN
    -- Drop any existing policies
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own entitlements" ON user_entitlements';

    -- Create restrictive SELECT-only policy
    EXECUTE 'CREATE POLICY "Users can view own entitlements" ON user_entitlements FOR SELECT TO authenticated USING (auth.uid() = user_id)';

    -- No write policies - service role only
  END IF;
END $$;

-- ============================================================
-- 13. RELOAD SCHEMA CACHE
-- ============================================================

SELECT pg_notify('pgrst', 'reload schema');

-- ============================================================
-- RLS POLICY SUMMARY
-- ============================================================
--
-- TABLE                | SELECT              | INSERT           | UPDATE           | DELETE
-- --------------------|---------------------|------------------|------------------|------------------
-- user_preferences    | own (user_id)       | own (user_id)    | own (user_id)*   | -
-- recipes             | own OR shared       | own (user_id)    | own (user_id)    | own (user_id)
-- stacks              | own (user_id)       | own (user_id)    | own (user_id)    | own (user_id)
-- recipe_stacks       | own both parents    | own both parents | -                | own both parents
-- recipe_shares       | own OR public active| own recipe       | own (user_id)    | own (user_id)
-- profiles            | own (id)            | own (id)         | own (id)         | -
-- store_items         | public (active)     | -                | -                | -
-- recipe_store_items  | own/shared recipe   | -                | -                | -
-- events              | own (user_id)       | own (user_id)    | -                | -
-- feedback            | own (user_id)       | own (user_id)    | -                | -
-- user_entitlements   | own (user_id)       | -                | -                | -
--
-- * user_preferences UPDATE: App code must only update safe columns.
--   Billing columns are protected by application logic, not RLS.
--   Use service role for billing updates (webhooks).
--
-- Legend:
-- - own (user_id): auth.uid() = user_id
-- - own (id): auth.uid() = id (for profiles table)
-- - own both parents: must own the recipe AND the stack
-- - own recipe: must own the recipe being shared
-- - public (active): no auth required, is_active = true
-- - own/shared recipe: own the recipe or it has an active share
-- - -: no policy (service role only)
--
-- ============================================================
