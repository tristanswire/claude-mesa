-- ============================================================
-- Store Schema Finalization
-- Ensures store tables are production-ready with optimal indexes and RLS
-- Safe to run multiple times (fully idempotent)
-- ============================================================

-- ============================================================
-- 1. TABLE VERIFICATION
-- ============================================================
-- Tables should already exist from 0008_store_items.sql:
--
-- store_items:
--   id UUID PK
--   name TEXT NOT NULL
--   description TEXT
--   image_url TEXT
--   affiliate_url TEXT NOT NULL
--   category TEXT NOT NULL
--   tag TEXT (optional badge like "Recommended")
--   sort_order INT NOT NULL DEFAULT 0
--   is_active BOOLEAN NOT NULL DEFAULT true
--   created_at TIMESTAMPTZ
--   updated_at TIMESTAMPTZ
--
-- recipe_store_items:
--   id UUID PK
--   recipe_id UUID FK → recipes(id) ON DELETE CASCADE
--   store_item_id UUID FK → store_items(id) ON DELETE CASCADE
--   sort_order INT NOT NULL DEFAULT 0
--   created_at TIMESTAMPTZ
--   UNIQUE(recipe_id, store_item_id)

-- ============================================================
-- 2. CONSTRAINTS (for idempotent seeding)
-- ============================================================

-- Add unique constraint on affiliate_url to enable ON CONFLICT upserts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'store_items_affiliate_url_key'
  ) THEN
    ALTER TABLE store_items ADD CONSTRAINT store_items_affiliate_url_key UNIQUE (affiliate_url);
  END IF;
END $$;

-- ============================================================
-- 3. INDEXES (idempotent - IF NOT EXISTS)
-- ============================================================

-- store_items indexes (should exist from 0008, but ensure they do)
CREATE INDEX IF NOT EXISTS idx_store_items_active
  ON store_items(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_store_items_category
  ON store_items(category);

CREATE INDEX IF NOT EXISTS idx_store_items_sort
  ON store_items(category, sort_order, name);

-- recipe_store_items indexes
CREATE INDEX IF NOT EXISTS idx_recipe_store_items_recipe
  ON recipe_store_items(recipe_id);

CREATE INDEX IF NOT EXISTS idx_recipe_store_items_item
  ON recipe_store_items(store_item_id);

-- NEW: Composite index for sorted recipe lookups
-- Optimizes: SELECT ... WHERE recipe_id = ? ORDER BY sort_order
CREATE INDEX IF NOT EXISTS idx_recipe_store_items_recipe_sort
  ON recipe_store_items(recipe_id, sort_order);

-- ============================================================
-- 4. RLS POLICIES (idempotent - DROP IF EXISTS + CREATE)
-- ============================================================

-- Ensure RLS is enabled
ALTER TABLE store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_store_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for idempotency
DROP POLICY IF EXISTS "Anyone can view active store items" ON store_items;
DROP POLICY IF EXISTS "Public can view active store items" ON store_items;
DROP POLICY IF EXISTS "Authenticated users can view recipe store mappings" ON recipe_store_items;

-- store_items: Public read for active items (storefront is public)
-- Rationale: The store page doesn't require auth, similar to a public product catalog
CREATE POLICY "Public can view active store items"
  ON store_items FOR SELECT
  USING (is_active = true);

-- recipe_store_items: Authenticated read only
-- Rationale: Recipe data requires auth, so recipe-store mappings should too
CREATE POLICY "Authenticated users can view recipe store mappings"
  ON recipe_store_items FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Note: No INSERT/UPDATE/DELETE policies
-- Writes are restricted to service role only (admin operations)

-- ============================================================
-- 5. UPDATED_AT TRIGGER
-- ============================================================
-- Ensure the trigger exists (uses shared update_updated_at_column function)

-- First ensure the function exists (should be created in an earlier migration)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to store_items (idempotent)
DROP TRIGGER IF EXISTS update_store_items_updated_at ON store_items;
CREATE TRIGGER update_store_items_updated_at
  BEFORE UPDATE ON store_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. COMMENTS
-- ============================================================
COMMENT ON TABLE store_items IS 'Affiliate product recommendations for the Mesa store';
COMMENT ON COLUMN store_items.tag IS 'Optional badge like "Recommended", "Best value", or "Staff pick"';
COMMENT ON COLUMN store_items.affiliate_url IS 'Affiliate link URL (opens in new tab)';
COMMENT ON COLUMN store_items.sort_order IS 'Display order within category (lower = first)';
COMMENT ON COLUMN store_items.is_active IS 'Whether item appears in store (soft delete)';

COMMENT ON TABLE recipe_store_items IS 'Manual mapping of store items to recipes for "Shop this recipe" feature';
COMMENT ON COLUMN recipe_store_items.sort_order IS 'Display order for items in a recipe (lower = first)';

-- ============================================================
-- 7. RELOAD SCHEMA CACHE
-- ============================================================
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- POLICY SUMMARY
-- ============================================================
--
-- store_items:
--   SELECT: Public (anyone can view active items - public storefront)
--   INSERT: Service role only (admin)
--   UPDATE: Service role only (admin)
--   DELETE: Service role only (admin)
--
-- recipe_store_items:
--   SELECT: Authenticated users only (matches recipe access pattern)
--   INSERT: Service role only (admin)
--   UPDATE: Service role only (admin)
--   DELETE: Service role only (admin)
--
-- Rationale:
-- - Store items are publicly viewable like a product catalog
-- - Recipe-store mappings require auth since they're tied to recipe data
-- - All writes are admin-only to prevent unauthorized product/mapping changes
-- ============================================================
