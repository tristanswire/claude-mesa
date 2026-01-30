-- ============================================================
-- RECIPE SHARES - Public share links for recipes
-- ============================================================

-- ============================================================
-- TABLE: recipe_shares
-- ============================================================
CREATE TABLE recipe_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_recipe_shares_recipe_id ON recipe_shares(recipe_id);
CREATE INDEX idx_recipe_shares_user_id ON recipe_shares(user_id);
CREATE INDEX idx_recipe_shares_token ON recipe_shares(token) WHERE is_active = true;

-- Updated_at trigger
CREATE TRIGGER update_recipe_shares_updated_at
  BEFORE UPDATE ON recipe_shares
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE recipe_shares ENABLE ROW LEVEL SECURITY;

-- Owner can view their own shares
CREATE POLICY "Users can view own shares"
  ON recipe_shares FOR SELECT
  USING (auth.uid() = user_id);

-- Owner can create shares for their own recipes
CREATE POLICY "Users can create shares for own recipes"
  ON recipe_shares FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM recipes WHERE id = recipe_id AND user_id = auth.uid())
  );

-- Owner can update their own shares (e.g., revoke)
CREATE POLICY "Users can update own shares"
  ON recipe_shares FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Owner can delete their own shares
CREATE POLICY "Users can delete own shares"
  ON recipe_shares FOR DELETE
  USING (auth.uid() = user_id);

-- Public can view active share by token (for unauthenticated access)
CREATE POLICY "Anyone can view active shares by token"
  ON recipe_shares FOR SELECT
  USING (is_active = true);

-- ============================================================
-- ADDITIONAL POLICY ON RECIPES TABLE
-- Allow public read access to recipes that have an active share
-- ============================================================
CREATE POLICY "Anyone can view recipes with active share"
  ON recipes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipe_shares
      WHERE recipe_shares.recipe_id = recipes.id
      AND recipe_shares.is_active = true
    )
  );

-- ============================================================
-- HELPER FUNCTION: Generate URL-safe random token
-- ============================================================
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  token TEXT;
BEGIN
  -- Generate 16 random bytes, encode as base64, make URL-safe
  token := replace(replace(encode(gen_random_bytes(16), 'base64'), '+', '-'), '/', '_');
  -- Remove padding
  token := rtrim(token, '=');
  RETURN token;
END;
$$;
