-- Seed the live Informa portfolio pricing page (`/pp/informa-portfolio-e1820d252a4f`).
--
-- Generic-template page on the shared deal-config rails (same commercial
-- model as the NRS page): 70/30 split, take-or-pay pilot of 12-15 units
-- scaling to 50, and the per-unit floor ladder. Levers carry the rate-card
-- product family (src/lib/informa/products.ts) plus the show-placed media
-- unit; Loop ad slots derive from Informa-controlled machines only
-- (rebooker + media units, six slots each) via `slotSource`. The canonical
-- TypeScript config lives in src/lib/informa/deal.ts and this JSON mirrors it.

insert into public.partner_pricing_pages (
  slug,
  partner_name,
  show_label,
  status,
  template,
  config,
  hero
) values (
  'informa-portfolio-e1820d252a4f',
  'Informa',
  'Portfolio program · starting Connect Marketplace, Tampa',
  'live',
  'generic',
  '{
    "currency": "USD",
    "split": {"brightBlue": 0.7, "partner": 0.3},
    "commitment": {"pilotMinUnits": 12, "pilotMaxUnits": 15, "maxUnits": 50, "cutoffWeeks": 25},
    "levers": [
      {"key": "arrival", "label": "The Arrival — Registration Takeover", "unitsPerItem": 1, "retail": {"min": 50000, "max": 75000, "suggested": 60000, "step": 1000}},
      {"key": "draw", "label": "The Draw — Floor & Lounge Activation", "unitsPerItem": 1, "retail": {"min": 30000, "max": 60000, "suggested": 40000, "step": 1000}},
      {"key": "rebooker", "label": "The Rebooker — Organizer Rebooking Engine", "unitsPerItem": 1, "retail": {"min": 35000, "max": 50000, "suggested": 40000, "step": 1000}},
      {"key": "media-unit", "label": "Show-placed media unit — Informa-controlled, premium footfall", "unitsPerItem": 1, "note": "A show-branded machine Informa places in a high-footfall spot. It carries no line price of its own: it exists to host Loop ad slots, and it counts toward the fleet and the floor ladder like any other machine.", "retail": {"min": 0, "max": 0, "suggested": 0, "step": 500}},
      {"key": "loop", "label": "The Loop — Screen Ad Network", "unitsPerItem": 0, "slotSource": {"slotsPerUnit": 6, "sourceLevers": ["rebooker", "media-unit"]}, "note": "Six 10-second slots per Informa-controlled machine: the rebooking engine and show-placed media units. A machine sold to one sponsor carries that sponsor''s brand alone, so its screens are never in this inventory.", "retail": {"min": 3000, "max": 8000, "suggested": 5000, "step": 500}}
    ],
    "floorTiers": [
      {"label": "Pilot", "minUnits": 1, "maxUnits": 15, "floor": 15000},
      {"label": "Scale", "minUnits": 16, "maxUnits": 30, "floor": 13500},
      {"label": "Portfolio", "minUnits": 31, "maxUnits": 50, "floor": 12000}
    ]
  }'::jsonb,
  '{
    "title": "The Bright.Blue line for the Informa portfolio",
    "subtitle": "Four named products your reps can sell straight off the rate card, running on one set of commercial rails. The numbers below are live: build the mix you would actually sell and watch what the program earns."
  }'::jsonb
)
on conflict (slug) do nothing;

-- Rollback: delete from public.partner_pricing_pages where slug = 'informa-portfolio-e1820d252a4f';
