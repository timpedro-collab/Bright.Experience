-- Add gallery photos and hero image to the Costa Coffee case study.
-- Also link it to the Experience Portal machine.
-- (Canonical Costa hero/gallery now lives in supabase/seed.sql; this update
-- targets the seeded id and stays as an idempotent safety net.)
UPDATE case_studies SET
  hero_image_url = '/catalog/case-studies/costa-matcha/07-giant-cup-storefront.png',
  gallery_urls = '[
    "/catalog/case-studies/costa-matcha/08-matcha-merch-sign.png",
    "/catalog/case-studies/costa-matcha/06-full-setup-queue.png",
    "/catalog/case-studies/costa-matcha/09-aerial-queue.png",
    "/catalog/case-studies/costa-matcha/05-tap-to-start.png",
    "/catalog/case-studies/costa-matcha/01-girl-tapping-screen.png",
    "/catalog/case-studies/costa-matcha/02-winner-qr-scan.png",
    "/catalog/case-studies/costa-matcha/03-prize-selection.png",
    "/catalog/case-studies/costa-matcha/10-sampling-moment.png",
    "/catalog/case-studies/costa-matcha/04-winners-matchilda.png"
  ]'::jsonb
WHERE id = 'd1d1d1d1-d1d1-4d1d-8d1d-d1d1d1d1d1d1';

-- Add one of the Costa photos to the Experience Portal machine gallery
-- (the full setup shot shows the Europa beautifully)
UPDATE machines SET
  gallery_urls = '[
    "/catalog/case-studies/costa-matcha/06-full-setup-queue.png",
    "/catalog/case-studies/costa-matcha/01-girl-tapping-screen.png",
    "/catalog/case-studies/costa-matcha/05-tap-to-start.png"
  ]'::jsonb
WHERE id = 'a2a2a2a2-a2a2-4a2a-8a2a-a2a2a2a2a2a2';
