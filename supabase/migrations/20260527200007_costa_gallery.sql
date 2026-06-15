-- Add gallery photos and hero image to the Costa Coffee case study.
-- Also link it to the Experience Portal machine.
UPDATE case_studies SET
  hero_image_url = '/catalog/case-studies/costa-matcha/06-full-setup-queue.png',
  gallery_urls = '[
    "/catalog/case-studies/costa-matcha/01-girl-tapping-screen.png",
    "/catalog/case-studies/costa-matcha/02-winner-qr-scan.png",
    "/catalog/case-studies/costa-matcha/03-prize-selection.png",
    "/catalog/case-studies/costa-matcha/04-winners-matchilda.png",
    "/catalog/case-studies/costa-matcha/05-tap-to-start.png",
    "/catalog/case-studies/costa-matcha/06-full-setup-queue.png"
  ]'::jsonb
WHERE id = 'c5c5c5c5-c5c5-4c5c-8c5c-c5c5c5c5c5c5';

-- Add one of the Costa photos to the Experience Portal machine gallery
-- (the full setup shot shows the Europa beautifully)
UPDATE machines SET
  gallery_urls = '[
    "/catalog/case-studies/costa-matcha/06-full-setup-queue.png",
    "/catalog/case-studies/costa-matcha/01-girl-tapping-screen.png",
    "/catalog/case-studies/costa-matcha/05-tap-to-start.png"
  ]'::jsonb
WHERE id = 'a2a2a2a2-a2a2-4a2a-8a2a-a2a2a2a2a2a2';
