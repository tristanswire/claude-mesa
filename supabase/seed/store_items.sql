-- ============================================================
-- Seed Data: Store Items
-- Sample affiliate products for Mesa Store
-- ============================================================

-- Clear existing items (optional, comment out if you want to keep existing)
-- TRUNCATE store_items CASCADE;

-- Pans
INSERT INTO store_items (name, description, image_url, affiliate_url, category, tag, sort_order) VALUES
('Lodge Cast Iron Skillet 12"', 'The workhorse of my kitchen. Perfect for searing, baking, and everything in between.', 'https://images.unsplash.com/photo-1585664811087-47f65abbad64?w=400', 'https://example.com/lodge-skillet', 'Pans', 'Recommended', 1),
('All-Clad Stainless Steel Sauté Pan', 'Restaurant-quality pan that heats evenly. Worth the investment.', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', 'https://example.com/allclad-saute', 'Pans', NULL, 2),
('Le Creuset Dutch Oven 5.5qt', 'For braises, soups, and bread baking. A lifetime piece.', 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=400', 'https://example.com/lecreuset-dutch', 'Pans', 'Staff Pick', 3),
('Non-Stick Frying Pan Set', 'Great for eggs and delicate fish. I replace these every couple years.', 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400', 'https://example.com/nonstick-set', 'Pans', NULL, 4)
ON CONFLICT DO NOTHING;

-- Knives
INSERT INTO store_items (name, description, image_url, affiliate_url, category, tag, sort_order) VALUES
('Victorinox Fibrox Pro Chef Knife 8"', 'Best value chef knife. Sharp out of the box and easy to maintain.', 'https://images.unsplash.com/photo-1566454419290-57a0589c9b17?w=400', 'https://example.com/victorinox-chef', 'Knives', 'Recommended', 1),
('Wüsthof Classic Santoku', 'Perfect for precision vegetable work. Great balance.', 'https://images.unsplash.com/photo-1593618998160-e34014e67f23?w=400', 'https://example.com/wusthof-santoku', 'Knives', NULL, 2),
('Mercer Culinary Paring Knife', 'Essential for detail work. Affordable and reliable.', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 'https://example.com/mercer-paring', 'Knives', NULL, 3),
('Shun Classic Bread Knife', 'Makes quick work of crusty loaves without crushing.', 'https://images.unsplash.com/photo-1591189824344-9e4e4b8f3f28?w=400', 'https://example.com/shun-bread', 'Knives', NULL, 4)
ON CONFLICT DO NOTHING;

-- Tools
INSERT INTO store_items (name, description, image_url, affiliate_url, category, tag, sort_order) VALUES
('OXO Good Grips Tongs', 'Sturdy, comfortable, and the lock mechanism actually works.', 'https://images.unsplash.com/photo-1556909190-eccf4a8bf97a?w=400', 'https://example.com/oxo-tongs', 'Tools', 'Recommended', 1),
('Microplane Zester', 'For citrus zest, hard cheeses, garlic. Indispensable.', 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=400', 'https://example.com/microplane', 'Tools', 'Staff Pick', 2),
('ThermoWorks Thermapen', 'Instant read thermometer. Splurge-worthy accuracy.', 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=400', 'https://example.com/thermapen', 'Tools', NULL, 3),
('Bench Scraper', 'For dividing dough, cleaning surfaces, scooping ingredients.', 'https://images.unsplash.com/photo-1517433670267-30f41c09d9bb?w=400', 'https://example.com/bench-scraper', 'Tools', NULL, 4),
('Fish Spatula', 'Thin, flexible, perfect for flipping delicate items.', 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=400', 'https://example.com/fish-spatula', 'Tools', NULL, 5)
ON CONFLICT DO NOTHING;

-- Appliances
INSERT INTO store_items (name, description, image_url, affiliate_url, category, tag, sort_order) VALUES
('KitchenAid Stand Mixer', 'The kitchen centerpiece. Kneads bread dough while you prep.', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400', 'https://example.com/kitchenaid', 'Appliances', 'Recommended', 1),
('Instant Pot Duo 6qt', 'Pressure cooker, slow cooker, rice maker in one.', 'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=400', 'https://example.com/instant-pot', 'Appliances', NULL, 2),
('Vitamix Blender', 'Smoothies to soups to nut butters. Powerful and durable.', 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400', 'https://example.com/vitamix', 'Appliances', NULL, 3),
('Breville Smart Oven', 'Convection toaster oven. Better than my actual oven for many things.', 'https://images.unsplash.com/photo-1585664811087-47f65abbad64?w=400', 'https://example.com/breville-oven', 'Appliances', NULL, 4)
ON CONFLICT DO NOTHING;

-- Pantry
INSERT INTO store_items (name, description, image_url, affiliate_url, category, tag, sort_order) VALUES
('Diamond Crystal Kosher Salt', 'My go-to salt. Flaky, easy to pinch, consistent.', 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=400', 'https://example.com/diamond-salt', 'Pantry', 'Recommended', 1),
('Maldon Sea Salt Flakes', 'Finishing salt for that perfect crunch on top.', 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=400', 'https://example.com/maldon-salt', 'Pantry', NULL, 2),
('California Olive Ranch EVOO', 'Fresh, affordable extra virgin olive oil for everyday use.', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400', 'https://example.com/olive-oil', 'Pantry', NULL, 3),
('San Marzano Tomatoes', 'The only canned tomatoes I buy for pasta sauce.', 'https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=400', 'https://example.com/san-marzano', 'Pantry', 'Staff Pick', 4)
ON CONFLICT DO NOTHING;

-- Meal Prep
INSERT INTO store_items (name, description, image_url, affiliate_url, category, tag, sort_order) VALUES
('Glass Meal Prep Containers', 'Durable, microwave-safe, no plastic leaching.', 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400', 'https://example.com/glass-containers', 'Meal Prep', 'Recommended', 1),
('Deli Containers 16oz', 'Perfect for storing prepped ingredients and leftovers.', 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400', 'https://example.com/deli-containers', 'Meal Prep', NULL, 2),
('Silicone Freezer Bags', 'Reusable, easy to clean, great for freezing portions.', 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400', 'https://example.com/silicone-bags', 'Meal Prep', NULL, 3),
('Mason Jars Set', 'For overnight oats, salads, pickles, and storage.', 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400', 'https://example.com/mason-jars', 'Meal Prep', NULL, 4)
ON CONFLICT DO NOTHING;

-- Verify
SELECT category, COUNT(*) as item_count FROM store_items GROUP BY category ORDER BY category;
