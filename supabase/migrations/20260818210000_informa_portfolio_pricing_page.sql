-- Seed the live Informa portfolio pricing page (`/pp/informa-portfolio-e1820d252a4f`).
--
-- Generic-template page on the shared deal-config rails (same commercial
-- model as the NRS page): 70/30 split, take-or-pay pilot of 12-15 units
-- scaling to 50, and the per-unit floor ladder. Levers carry the rate-card
-- product family (src/lib/informa/products.ts) plus the house media unit;
-- Screen Ad Network slots derive from Informa-controlled machines only
-- (rebooking engines + house media units, six slots each) via `slotSource`.
-- The Rebooking Engine is a flat service fee Informa pays (revenue:
-- "service"), so it never enters gross sponsorship revenue or the split.
-- The canonical TypeScript config lives in src/lib/informa/deal.ts and this
-- JSON mirrors it.

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
      {"key": "arrival", "label": "Registration Takeover", "unitsPerItem": 1, "note": "A sponsor-owned machine at registration or the entrance, sold once per show — counts here span the shows in the program. Its screens carry that sponsor''s brand alone.", "retail": {"min": 50000, "max": 75000, "suggested": 60000, "step": 1000}},
      {"key": "draw", "label": "Show-Floor Activation", "unitsPerItem": 1, "note": "Sponsor-owned machines on the floor or in lounges — several can run per show. Screens carry the sponsor''s brand alone.", "retail": {"min": 30000, "max": 60000, "suggested": 40000, "step": 1000}},
      {"key": "rebooker", "label": "Rebooking Engine", "unitsPerItem": 1, "revenue": "service", "note": "A flat service fee you pay per show, not split revenue: it buys the show-branded rebooking machine on your own booth. Its screens are yours, so they host Screen Ad Network slots.", "retail": {"min": 35000, "max": 50000, "suggested": 40000, "step": 1000}},
      {"key": "media-unit", "label": "House Media Unit", "unitsPerItem": 1, "note": "A show-branded machine you place in a high-footfall spot. It carries no line price of its own: it exists to host Screen Ad Network slots, and it counts toward the fleet and the floor ladder like any other machine.", "retail": {"min": 0, "max": 0, "suggested": 0, "step": 500}},
      {"key": "loop", "label": "Screen Ad Network", "unitsPerItem": 0, "slotSource": {"slotsPerUnit": 6, "sourceLevers": ["rebooker", "media-unit"]}, "note": "Six 10-second slots per show-controlled machine: rebooking engines and house media units. A machine sold to one sponsor carries that sponsor''s brand alone, so its screens are never in this inventory.", "retail": {"min": 3000, "max": 8000, "suggested": 5000, "step": 500}}
    ],
    "floorTiers": [
      {"label": "Pilot", "minUnits": 1, "maxUnits": 15, "floor": 15000},
      {"label": "Scale", "minUnits": 16, "maxUnits": 30, "floor": 13500},
      {"label": "Portfolio", "minUnits": 31, "maxUnits": 50, "floor": 12000}
    ],
    "presets": [
      {"key": "pilot", "label": "Pilot", "description": "12 machines across the first shows, Tampa-style mix", "counts": {"arrival": 2, "draw": 5, "rebooker": 2, "media-unit": 3, "loop": 18}},
      {"key": "scale", "label": "Scale", "description": "24 machines once the pilot proves out", "counts": {"arrival": 4, "draw": 10, "rebooker": 4, "media-unit": 6, "loop": 42}},
      {"key": "portfolio", "label": "Portfolio", "description": "40 machines across the show calendar", "counts": {"arrival": 7, "draw": 17, "rebooker": 6, "media-unit": 10, "loop": 72}}
    ]
  }'::jsonb,
  '{
    "title": "The Bright.Blue line for the Informa portfolio",
    "subtitle": "Four plain-named products your reps can sell straight off the rate card, running on one set of commercial rails. The numbers below are live: build the mix you would actually sell and watch what the program earns.",
    "explorerNote": "Counts are portfolio-wide, across every show you book into the program — a Registration Takeover is one per show, so four of them means four shows. Start from a scenario, then drag anything.",
    "links": [
      {"label": "Rate card & seller''s kit", "href": "/informa/kit"},
      {"label": "Sample proof-of-performance report", "href": "/informa/report"},
      {"label": "Partnership deck", "href": "/informa"}
    ]
  }'::jsonb
)
on conflict (slug) do update set
  partner_name = excluded.partner_name,
  show_label = excluded.show_label,
  status = excluded.status,
  template = excluded.template,
  config = excluded.config,
  hero = excluded.hero;

-- Rollback: delete from public.partner_pricing_pages where slug = 'informa-portfolio-e1820d252a4f';
