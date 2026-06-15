-- Rename all machines to "Experience Portal" with spec-based differentiation.
-- Europa is the standard unit; old brand names are retired.

UPDATE machines SET
  name = 'Experience Portal',
  slug = 'experience-portal',
  tagline = 'The standard activation unit',
  description = 'The Europa — a 55" portrait touchscreen wrapped in a fully branded shell, with built-in lead capture, prize dispensing, and Bright.Blue''s entire game engine. The machine behind the majority of Bright.Blue activations. Compact enough for retail, powerful enough for stadiums.'
WHERE id = 'a2a2a2a2-a2a2-4a2a-8a2a-a2a2a2a2a2a2';

UPDATE machines SET
  name = 'Experience Portal Compact',
  slug = 'experience-portal-compact',
  tagline = 'The compact gifting kiosk',
  description = 'A smaller-footprint Experience Portal with single-pull dispense, designed for high-frequency sampling moments at retail, transport hubs, and festivals. Same game engine, same lead capture — just smaller.'
WHERE id = 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1';

UPDATE machines SET
  name = 'Experience Portal XL',
  slug = 'experience-portal-xl',
  tagline = 'The large-format interactive experience',
  description = 'Full-body interactive experience cabinet with a 65" landscape display, capacitive touch, RFID, and Bright.Blue''s game engine. Built for activations where presence and scale matter.'
WHERE id = 'a3a3a3a3-a3a3-4a3a-8a3a-a3a3a3a3a3a3';

UPDATE machines SET
  name = 'Experience Portal Studio',
  slug = 'experience-portal-studio',
  tagline = 'Bespoke creative + content',
  description = 'The Bright.Blue studio team — design, animation, video, and photography — packaged as bookable creative capacity alongside any hardware activation.'
WHERE id = 'a4a4a4a4-a4a4-4a4a-8a4a-a4a4a4a4a4a4';

-- Also update the packages table references (slug-based)
UPDATE packages SET machine_id = 'a2a2a2a2-a2a2-4a2a-8a2a-a2a2a2a2a2a2'
WHERE machine_id = 'a2a2a2a2-a2a2-4a2a-8a2a-a2a2a2a2a2a2';

-- Add Costa Coffee case study
INSERT INTO case_studies (
  id, title, slug, client_name, event_type, location,
  description, hero_image_url, gallery_urls,
  stats_json, testimonial_quote, testimonial_author,
  is_published, published_at
) VALUES (
  'c5c5c5c5-c5c5-4c5c-8c5c-c5c5c5c5c5c5',
  'Costa Coffee — Catch-A-Matcha',
  'costa-coffee-catch-a-matcha',
  'Costa Coffee',
  'experiential',
  '10 UK city centres across 5 weekends',
  'Costa Coffee wanted to launch their new Iced Matcha range with a moment people would actually remember. Bright.Blue designed "Catch-A-Matcha" — a reflex-based touchscreen game housed inside a giant, fully branded matcha cup Experience Portal. Passers-by tapped iced matcha drinks as they popped up on screen. Score high enough and you win — scan the QR code for a free Iced Matcha from the nearest Costa store, or choose from exclusive merch including the "Matchilda" plush and Crochet Cosie. The activation drew queues around the block, generated thousands of QR redemptions, and created an avalanche of organic social content.',
  null,
  '[]'::jsonb,
  '{}'::jsonb,
  null, null,
  true,
  now()
) ON CONFLICT (id) DO NOTHING;
