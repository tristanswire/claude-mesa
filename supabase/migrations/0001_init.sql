-- ============================================================
-- RECIPE APP MVP - SUPABASE SCHEMA (v2 - hardened)
-- ============================================================
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- Prerequisites: Supabase project with Auth enabled
-- ============================================================

-- Use pgcrypto for UUID generation (preferred over uuid-ossp)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- TABLE: user_preferences
-- ============================================================
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_unit_system TEXT NOT NULL DEFAULT 'original'
    CHECK (preferred_unit_system IN ('imperial', 'metric', 'original')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create preferences when user signs up (hardened)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TABLE: recipes
-- ============================================================
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  servings INTEGER,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  source_url TEXT,

  -- JSONB arrays for ingredients and instructions
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  instructions JSONB NOT NULL DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_user_updated ON recipes(user_id, updated_at DESC);
CREATE INDEX idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX idx_recipes_title ON recipes USING gin(to_tsvector('english', title));

-- ============================================================
-- TABLE: stacks (collections)
-- ============================================================
CREATE TABLE stacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate stack names per user
  CONSTRAINT unique_stack_name_per_user UNIQUE (user_id, name)
);

-- Indexes
CREATE INDEX idx_stacks_user_id ON stacks(user_id);

-- ============================================================
-- TABLE: recipe_stacks (many-to-many junction)
-- ============================================================
CREATE TABLE recipe_stacks (
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  stack_id UUID NOT NULL REFERENCES stacks(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (recipe_id, stack_id)
);

-- Indexes
CREATE INDEX idx_recipe_stacks_stack_id ON recipe_stacks(stack_id);
CREATE INDEX idx_recipe_stacks_recipe_id ON recipe_stacks(recipe_id);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply to all tables with updated_at
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stacks_updated_at
  BEFORE UPDATE ON stacks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_stacks ENABLE ROW LEVEL SECURITY;

-- user_preferences: users can only access their own
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- recipes: users can only CRUD their own
CREATE POLICY "Users can view own recipes"
  ON recipes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own recipes"
  ON recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes"
  ON recipes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes"
  ON recipes FOR DELETE
  USING (auth.uid() = user_id);

-- stacks: users can only CRUD their own
CREATE POLICY "Users can view own stacks"
  ON stacks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own stacks"
  ON stacks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stacks"
  ON stacks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stacks"
  ON stacks FOR DELETE
  USING (auth.uid() = user_id);

-- recipe_stacks: users can only link recipes/stacks they own
CREATE POLICY "Users can view own recipe_stacks"
  ON recipe_stacks FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM recipes WHERE id = recipe_id AND user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM stacks WHERE id = stack_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create own recipe_stacks"
  ON recipe_stacks FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM recipes WHERE id = recipe_id AND user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM stacks WHERE id = stack_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete own recipe_stacks"
  ON recipe_stacks FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM recipes WHERE id = recipe_id AND user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM stacks WHERE id = stack_id AND user_id = auth.uid())
  );

-- ============================================================
-- JSONB STRUCTURE COMMENTS (for reference)
-- ============================================================
COMMENT ON COLUMN recipes.ingredients IS 'Array of Ingredient objects:
[{
  "id": "uuid",
  "name": "cumin",
  "notes": "ground",
  "originalQuantity": 1,
  "originalUnit": "tsp",
  "originalText": "1 tsp cumin, ground",
  "canonicalQuantity": 4.93,
  "canonicalUnit": "ml",
  "ingredientType": "volume",
  "orderIndex": 0
}]';

COMMENT ON COLUMN recipes.instructions IS 'Array of InstructionStep objects:
[{
  "id": "uuid",
  "stepNumber": 1,
  "text": "Add the spices and cook until fragrant",
  "refs": [{ "ingredientIds": ["uuid1", "uuid2"], "placement": "end" }]
}]';
