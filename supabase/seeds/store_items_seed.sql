-- ============================================================
-- Store Items Seed Data
-- 25+ curated kitchen products across 6 categories
-- Safe to run multiple times (idempotent via ON CONFLICT)
-- ============================================================

-- Add unique constraint on affiliate_url if it doesn't exist
-- This enables idempotent inserts
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
-- CATEGORY: Pans
-- ============================================================
INSERT INTO store_items (name, description, image_url, affiliate_url, category, tag, sort_order, is_active)
VALUES
  (
    'Lodge 12" Cast Iron Skillet',
    'Pre-seasoned cast iron that gets better with age. Perfect for searing, baking, and stovetop-to-oven dishes.',
    'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400',
    'https://amazon.com/dp/B00006JSUB?tag=mesa-20',
    'Pans',
    'Recommended',
    10,
    true
  ),
  (
    'All-Clad D3 12" Stainless Fry Pan',
    'Tri-ply stainless steel for even heating. Restaurant-quality performance at home.',
    'https://images.unsplash.com/photo-1556909114-44e3e9699e2b?w=400',
    'https://amazon.com/dp/B00005RIFQ?tag=mesa-20',
    'Pans',
    NULL,
    20,
    true
  ),
  (
    'OXO Good Grips 12" Non-Stick Pro',
    'PFOA-free ceramic non-stick. Great for eggs and delicate foods.',
    NULL,
    'https://amazon.com/dp/B07PQYVKFN?tag=mesa-20',
    'Pans',
    NULL,
    30,
    true
  ),
  (
    'Lodge 5-Quart Dutch Oven',
    'Enameled cast iron for braises, soups, and bread. Goes from stovetop to oven.',
    'https://images.unsplash.com/photo-1622973536968-3ead9e780960?w=400',
    'https://amazon.com/dp/B000N501BK?tag=mesa-20',
    'Pans',
    'Best value',
    40,
    true
  )
ON CONFLICT (affiliate_url) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category,
  tag = EXCLUDED.tag,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================================
-- CATEGORY: Knives
-- ============================================================
INSERT INTO store_items (name, description, image_url, affiliate_url, category, tag, sort_order, is_active)
VALUES
  (
    'Victorinox Fibrox Pro 8" Chef''s Knife',
    'The best value chef''s knife. Sharp, comfortable, and used in culinary schools worldwide.',
    'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=400',
    'https://amazon.com/dp/B008M5U1C2?tag=mesa-20',
    'Knives',
    'Recommended',
    10,
    true
  ),
  (
    'Wüsthof Pro 8" Chef''s Knife',
    'German precision engineering. Full tang, high-carbon stainless steel.',
    NULL,
    'https://amazon.com/dp/B0000DJYL2?tag=mesa-20',
    'Knives',
    NULL,
    20,
    true
  ),
  (
    'Victorinox 3.25" Paring Knife',
    'Essential for detail work. Peeling, trimming, and precision cuts.',
    NULL,
    'https://amazon.com/dp/B0019WXPQY?tag=mesa-20',
    'Knives',
    NULL,
    30,
    true
  ),
  (
    'Mercer Culinary 10" Bread Knife',
    'Serrated edge glides through crusty bread without crushing.',
    NULL,
    'https://amazon.com/dp/B000PS1HS6?tag=mesa-20',
    'Knives',
    NULL,
    40,
    true
  ),
  (
    'King 1000/6000 Whetstone',
    'Keep your knives razor sharp. Dual grit for sharpening and polishing.',
    NULL,
    'https://amazon.com/dp/B001DT1X9O?tag=mesa-20',
    'Knives',
    NULL,
    50,
    true
  )
ON CONFLICT (affiliate_url) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category,
  tag = EXCLUDED.tag,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================================
-- CATEGORY: Tools
-- ============================================================
INSERT INTO store_items (name, description, image_url, affiliate_url, category, tag, sort_order, is_active)
VALUES
  (
    'ThermoWorks Thermapen ONE',
    'Instant-read in 1 second. The gold standard for meat thermometers.',
    'https://images.unsplash.com/photo-1608835291093-394b0c943a75?w=400',
    'https://thermoworks.com/thermapen-one?ref=mesa',
    'Tools',
    'Recommended',
    10,
    true
  ),
  (
    'OXO Good Grips 11-lb Food Scale',
    'Precise digital scale with pull-out display. Essential for baking.',
    NULL,
    'https://amazon.com/dp/B0020L6T7K?tag=mesa-20',
    'Tools',
    'Used often',
    20,
    true
  ),
  (
    'OXO Steel Tongs (12")',
    'Sturdy, comfortable, and heat-resistant. The extension of your hand.',
    NULL,
    'https://amazon.com/dp/B00004OCIP?tag=mesa-20',
    'Tools',
    NULL,
    30,
    true
  ),
  (
    'Fish Spatula (Slotted Turner)',
    'Thin, flexible edge slides under delicate foods. Not just for fish.',
    NULL,
    'https://amazon.com/dp/B000OFOW1I?tag=mesa-20',
    'Tools',
    NULL,
    40,
    true
  ),
  (
    'Microplane Premium Zester',
    'Effortless citrus zest and hard cheese. Photo-etched blade stays sharp.',
    NULL,
    'https://amazon.com/dp/B00004S7V8?tag=mesa-20',
    'Tools',
    NULL,
    50,
    true
  ),
  (
    'Bench Scraper / Dough Cutter',
    'Move ingredients, portion dough, scrape surfaces clean. Simple but essential.',
    NULL,
    'https://amazon.com/dp/B000SSZ4Q4?tag=mesa-20',
    'Tools',
    NULL,
    60,
    true
  )
ON CONFLICT (affiliate_url) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category,
  tag = EXCLUDED.tag,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================================
-- CATEGORY: Appliances
-- ============================================================
INSERT INTO store_items (name, description, image_url, affiliate_url, category, tag, sort_order, is_active)
VALUES
  (
    'Instant Pot Duo 6-Quart',
    'Pressure cooker, slow cooker, rice cooker, and more. Weeknight dinner hero.',
    'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400',
    'https://amazon.com/dp/B06Y1YD5W7?tag=mesa-20',
    'Appliances',
    'Recommended',
    10,
    true
  ),
  (
    'Vitamix E310 Explorian Blender',
    'Restaurant-quality blending. Smoothies, soups, sauces, nut butters.',
    NULL,
    'https://amazon.com/dp/B0758JHZM3?tag=mesa-20',
    'Appliances',
    NULL,
    20,
    true
  ),
  (
    'KitchenAid Artisan 5-Qt Stand Mixer',
    'The workhorse for serious bakers. Doughs, batters, and attachments galore.',
    NULL,
    'https://amazon.com/dp/B00005UP2P?tag=mesa-20',
    'Appliances',
    NULL,
    30,
    true
  ),
  (
    'Breville Smart Oven Air Fryer Pro',
    'Countertop oven that does it all. Air fry, bake, roast, dehydrate.',
    NULL,
    'https://amazon.com/dp/B07XF8T6PY?tag=mesa-20',
    'Appliances',
    NULL,
    40,
    true
  )
ON CONFLICT (affiliate_url) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category,
  tag = EXCLUDED.tag,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================================
-- CATEGORY: Pantry
-- ============================================================
INSERT INTO store_items (name, description, image_url, affiliate_url, category, tag, sort_order, is_active)
VALUES
  (
    'California Olive Ranch Extra Virgin Olive Oil',
    'Fresh, affordable EVOO for everyday cooking. Great for dressings and finishing.',
    'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400',
    'https://amazon.com/dp/B004ULUVU4?tag=mesa-20',
    'Pantry',
    'Used often',
    10,
    true
  ),
  (
    'Diamond Crystal Kosher Salt (3 lb)',
    'The chef''s choice. Light, flaky crystals that dissolve evenly.',
    NULL,
    'https://amazon.com/dp/B0011BPMUK?tag=mesa-20',
    'Pantry',
    'Recommended',
    20,
    true
  ),
  (
    'Maldon Sea Salt Flakes',
    'Finishing salt for that perfect crunch. Sprinkle on steaks, chocolate, salads.',
    NULL,
    'https://amazon.com/dp/B00017028M?tag=mesa-20',
    'Pantry',
    NULL,
    30,
    true
  ),
  (
    'Kikkoman Soy Sauce (1 Quart)',
    'Naturally brewed for complex flavor. Essential for Asian cooking and marinades.',
    NULL,
    'https://amazon.com/dp/B0005ZXPS4?tag=mesa-20',
    'Pantry',
    NULL,
    40,
    true
  ),
  (
    'Penzeys Spices - Everyday Seasoning',
    'Versatile blend of garlic, paprika, and herbs. Goes on everything.',
    NULL,
    'https://penzeys.com/everyday-seasoning?ref=mesa',
    'Pantry',
    NULL,
    50,
    true
  )
ON CONFLICT (affiliate_url) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category,
  tag = EXCLUDED.tag,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================================
-- CATEGORY: Meal Prep
-- ============================================================
INSERT INTO store_items (name, description, image_url, affiliate_url, category, tag, sort_order, is_active)
VALUES
  (
    'Pyrex Simply Store 10-Piece Glass Set',
    'Microwave, oven, freezer, and dishwasher safe. See what''s inside.',
    'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400',
    'https://amazon.com/dp/B00LGLHZNM?tag=mesa-20',
    'Meal Prep',
    'Recommended',
    10,
    true
  ),
  (
    'Stasher Reusable Silicone Bags (4 Pack)',
    'Eco-friendly alternative to plastic bags. Sous vide, freeze, microwave safe.',
    NULL,
    'https://amazon.com/dp/B07LFVKZ5M?tag=mesa-20',
    'Meal Prep',
    NULL,
    20,
    true
  ),
  (
    'OXO Good Grips 3-Piece Cutting Board Set',
    'Color-coded to prevent cross-contamination. Non-slip edges.',
    NULL,
    'https://amazon.com/dp/B000AAM0EI?tag=mesa-20',
    'Meal Prep',
    NULL,
    30,
    true
  ),
  (
    'FoodSaver Vacuum Sealer System',
    'Extend food freshness 5x longer. Great for batch cooking and freezing.',
    NULL,
    'https://amazon.com/dp/B08HSLNH7P?tag=mesa-20',
    'Meal Prep',
    NULL,
    40,
    true
  ),
  (
    'Mason Jars Wide Mouth (12 Pack)',
    'Overnight oats, salads, fermenting, dry storage. Endlessly versatile.',
    NULL,
    'https://amazon.com/dp/B01N6QBJG0?tag=mesa-20',
    'Meal Prep',
    'Best value',
    50,
    true
  )
ON CONFLICT (affiliate_url) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category,
  tag = EXCLUDED.tag,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================================
-- SUMMARY
-- ============================================================
-- Total: 28 products across 6 categories
--
-- Category breakdown:
--   Pans:       4 items (Lodge skillet, All-Clad, OXO non-stick, Dutch oven)
--   Knives:     5 items (Victorinox chef, Wüsthof, paring, bread, whetstone)
--   Tools:      6 items (Thermapen, scale, tongs, spatula, zester, bench scraper)
--   Appliances: 4 items (Instant Pot, Vitamix, KitchenAid, Breville)
--   Pantry:     5 items (EVOO, Diamond Crystal, Maldon, soy sauce, Penzeys)
--   Meal Prep:  5 items (Pyrex, Stasher, cutting boards, vacuum sealer, mason jars)
--
-- Tags used:
--   "Recommended" - Top pick in category (6 items)
--   "Best value"  - Great quality for price (2 items)
--   "Used often"  - Everyday essentials (2 items)
--
-- To edit later:
--   UPDATE store_items SET tag = 'New tag' WHERE name = 'Product Name';
--   UPDATE store_items SET is_active = false WHERE name = 'Product Name';
--   UPDATE store_items SET sort_order = 5 WHERE name = 'Product Name';
-- ============================================================

-- Verify insertion
SELECT category, COUNT(*) as count FROM store_items WHERE is_active = true GROUP BY category ORDER BY category;
