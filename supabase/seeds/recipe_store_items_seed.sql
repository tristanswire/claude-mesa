-- ============================================================
-- Recipe Store Items Seed Data
-- Maps store items to specific recipes for "Shop this recipe"
--
-- HOW TO USE:
-- 1. First, run the store_items_seed.sql to populate products
-- 2. Find recipe IDs from your database using the query below
-- 3. Replace the placeholder recipe IDs with real ones
-- 4. Run this script
-- ============================================================

-- ============================================================
-- STEP 1: FIND YOUR RECIPE IDs
-- Run this query to see your recipes:
-- ============================================================
-- SELECT id, title FROM recipes ORDER BY created_at DESC LIMIT 20;

-- ============================================================
-- STEP 2: FIND STORE ITEM IDs
-- Products are identified by affiliate_url for stability
-- ============================================================

-- Create a temporary table to hold mappings we want to insert
-- This approach lets us reference store_items by affiliate_url instead of UUID

-- Helper function to get store_item_id by affiliate_url
CREATE OR REPLACE FUNCTION get_store_item_id(url TEXT)
RETURNS UUID AS $$
  SELECT id FROM store_items WHERE affiliate_url = url LIMIT 1;
$$ LANGUAGE SQL;

-- ============================================================
-- STEP 3: INSERT MAPPINGS
-- Replace 'YOUR_RECIPE_ID_X' with actual recipe UUIDs
-- ============================================================

-- Example: Map kitchen essentials to a pasta recipe
-- Uncomment and replace recipe IDs to use

/*
-- Recipe 1: Pasta dish (replace with your recipe ID)
INSERT INTO recipe_store_items (recipe_id, store_item_id, sort_order)
SELECT
  'YOUR_RECIPE_ID_1'::uuid,
  get_store_item_id(url),
  sort_idx
FROM (VALUES
  ('https://amazon.com/dp/B00005RIFQ?tag=mesa-20', 10),  -- All-Clad pan
  ('https://amazon.com/dp/B0011BPMUK?tag=mesa-20', 20),  -- Diamond Crystal salt
  ('https://amazon.com/dp/B004ULUVU4?tag=mesa-20', 30)   -- Olive oil
) AS items(url, sort_idx)
WHERE get_store_item_id(url) IS NOT NULL
ON CONFLICT (recipe_id, store_item_id) DO NOTHING;

-- Recipe 2: Steak recipe
INSERT INTO recipe_store_items (recipe_id, store_item_id, sort_order)
SELECT
  'YOUR_RECIPE_ID_2'::uuid,
  get_store_item_id(url),
  sort_idx
FROM (VALUES
  ('https://amazon.com/dp/B00006JSUB?tag=mesa-20', 10),  -- Lodge cast iron
  ('https://thermoworks.com/thermapen-one?ref=mesa', 20), -- Thermapen
  ('https://amazon.com/dp/B000AAM0EI?tag=mesa-20', 30),  -- Cutting boards
  ('https://amazon.com/dp/B0011BPMUK?tag=mesa-20', 40)   -- Diamond Crystal salt
) AS items(url, sort_idx)
WHERE get_store_item_id(url) IS NOT NULL
ON CONFLICT (recipe_id, store_item_id) DO NOTHING;

-- Recipe 3: Baking recipe
INSERT INTO recipe_store_items (recipe_id, store_item_id, sort_order)
SELECT
  'YOUR_RECIPE_ID_3'::uuid,
  get_store_item_id(url),
  sort_idx
FROM (VALUES
  ('https://amazon.com/dp/B00005UP2P?tag=mesa-20', 10),  -- KitchenAid mixer
  ('https://amazon.com/dp/B0020L6T7K?tag=mesa-20', 20),  -- OXO scale
  ('https://amazon.com/dp/B00LGLHZNM?tag=mesa-20', 30)   -- Pyrex containers
) AS items(url, sort_idx)
WHERE get_store_item_id(url) IS NOT NULL
ON CONFLICT (recipe_id, store_item_id) DO NOTHING;
*/

-- ============================================================
-- QUICK START: Auto-map to most recent recipes
-- This will map some items to your 3 most recent recipes
-- ============================================================

DO $$
DECLARE
  recipe_ids UUID[];
  r1 UUID;
  r2 UUID;
  r3 UUID;
BEGIN
  -- Get 3 most recent recipes
  SELECT ARRAY_AGG(id ORDER BY created_at DESC)
  INTO recipe_ids
  FROM (SELECT id, created_at FROM recipes LIMIT 3) sub;

  -- Exit if no recipes
  IF recipe_ids IS NULL OR array_length(recipe_ids, 1) < 1 THEN
    RAISE NOTICE 'No recipes found. Create some recipes first.';
    RETURN;
  END IF;

  r1 := recipe_ids[1];
  r2 := COALESCE(recipe_ids[2], recipe_ids[1]);
  r3 := COALESCE(recipe_ids[3], recipe_ids[1]);

  RAISE NOTICE 'Mapping to recipes: %, %, %', r1, r2, r3;

  -- Recipe 1: General cooking essentials
  INSERT INTO recipe_store_items (recipe_id, store_item_id, sort_order)
  SELECT r1, id, row_number() OVER () * 10
  FROM store_items
  WHERE affiliate_url IN (
    'https://amazon.com/dp/B00006JSUB?tag=mesa-20',  -- Lodge cast iron
    'https://amazon.com/dp/B0011BPMUK?tag=mesa-20',  -- Diamond Crystal salt
    'https://amazon.com/dp/B004ULUVU4?tag=mesa-20',  -- Olive oil
    'https://amazon.com/dp/B00004OCIP?tag=mesa-20'   -- Tongs
  )
  AND is_active = true
  ON CONFLICT (recipe_id, store_item_id) DO NOTHING;

  -- Recipe 2: Different essentials
  IF r2 != r1 THEN
    INSERT INTO recipe_store_items (recipe_id, store_item_id, sort_order)
    SELECT r2, id, row_number() OVER () * 10
    FROM store_items
    WHERE affiliate_url IN (
      'https://amazon.com/dp/B008M5U1C2?tag=mesa-20',  -- Victorinox knife
      'https://amazon.com/dp/B0020L6T7K?tag=mesa-20',  -- OXO scale
      'https://thermoworks.com/thermapen-one?ref=mesa', -- Thermapen
      'https://amazon.com/dp/B00004S7V8?tag=mesa-20'   -- Microplane
    )
    AND is_active = true
    ON CONFLICT (recipe_id, store_item_id) DO NOTHING;
  END IF;

  -- Recipe 3: Appliances focus
  IF r3 != r1 AND r3 != r2 THEN
    INSERT INTO recipe_store_items (recipe_id, store_item_id, sort_order)
    SELECT r3, id, row_number() OVER () * 10
    FROM store_items
    WHERE affiliate_url IN (
      'https://amazon.com/dp/B06Y1YD5W7?tag=mesa-20',  -- Instant Pot
      'https://amazon.com/dp/B00LGLHZNM?tag=mesa-20',  -- Pyrex
      'https://amazon.com/dp/B0011BPMUK?tag=mesa-20'   -- Diamond Crystal salt
    )
    AND is_active = true
    ON CONFLICT (recipe_id, store_item_id) DO NOTHING;
  END IF;

  RAISE NOTICE 'Done! Check your recipes for "Shop this recipe" section.';
END $$;

-- ============================================================
-- VERIFY MAPPINGS
-- ============================================================
SELECT
  r.title as recipe,
  s.name as store_item,
  rsm.sort_order
FROM recipe_store_items rsm
JOIN recipes r ON r.id = rsm.recipe_id
JOIN store_items s ON s.id = rsm.store_item_id
ORDER BY r.title, rsm.sort_order;

-- ============================================================
-- CLEANUP (if needed)
-- ============================================================
-- DELETE FROM recipe_store_items; -- Remove all mappings
-- DROP FUNCTION IF EXISTS get_store_item_id(TEXT); -- Remove helper
