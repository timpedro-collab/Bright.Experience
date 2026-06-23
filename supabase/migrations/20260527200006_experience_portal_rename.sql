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

-- The Costa Coffee "Catch-A-Matcha" case study is seeded canonically in
-- supabase/seed.sql (id d1d1…, slug costa-coffee-catch-a-matcha) with its
-- hero image, photo gallery and real performance stats. It was previously
-- inserted here under a second id/slug, which collided with the seed's unique
-- slug on a fresh reset, so that insert has been removed.
