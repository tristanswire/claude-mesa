-- ============================================================
-- Store Items + Recipe-Store Mapping
-- Affiliate product recommendations for Mesa
-- ============================================================

-- Create store_items table
CREATE TABLE IF NOT EXISTS store_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  affiliate_url TEXT NOT NULL,
  category TEXT NOT NULL,
  tag TEXT, -- e.g., "Recommended", "Staff pick", etc.
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_store_items_category ON store_items(category);
CREATE INDEX IF NOT EXISTS idx_store_items_active ON store_items(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_store_items_sort ON store_items(category, sort_order, name);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS update_store_items_updated_at ON store_items;
CREATE TRIGGER update_store_items_updated_at
  BEFORE UPDATE ON store_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create recipe_store_items junction table
CREATE TABLE IF NOT EXISTS recipe_store_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  store_item_id UUID NOT NULL REFERENCES store_items(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(recipe_id, store_item_id)
);

-- Create indexes for junction table
CREATE INDEX IF NOT EXISTS idx_recipe_store_items_recipe ON recipe_store_items(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_store_items_item ON recipe_store_items(store_item_id);

-- ============================================================
-- RLS Policies
-- ============================================================

-- Enable RLS
ALTER TABLE store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_store_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to make migration idempotent
DROP POLICY IF EXISTS "Anyone can view active store items" ON store_items;
DROP POLICY IF EXISTS "Authenticated users can view recipe store mappings" ON recipe_store_items;

-- Store items: readable by anyone (public storefront)
CREATE POLICY "Anyone can view active store items"
  ON store_items FOR SELECT
  USING (is_active = true);

-- Recipe-store mappings: readable by authenticated users
-- (follows same pattern as recipes - user must be logged in)
CREATE POLICY "Authenticated users can view recipe store mappings"
  ON recipe_store_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Note: INSERT/UPDATE/DELETE on these tables is restricted to service role only
-- (no client-side write policies). Admin UI would use service role or a future admin check.

-- Comments
COMMENT ON TABLE store_items IS 'Affiliate product recommendations';
COMMENT ON COLUMN store_items.tag IS 'Optional badge like "Recommended" or "Staff pick"';
COMMENT ON COLUMN store_items.affiliate_url IS 'Affiliate link (opens in new tab)';
COMMENT ON TABLE recipe_store_items IS 'Manual mapping of store items to recipes';

-- ============================================================
-- Reload PostgREST schema cache
-- ============================================================
NOTIFY pgrst, 'reload schema';
