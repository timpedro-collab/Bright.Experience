-- Curated mixes for the Informa portfolio pricing page
-- (`/pp/informa-portfolio-e1820d252a4f`), superseding 20260818210000.
--
-- What changed and why:
--   * Show-Floor Activation split into two products: Show-Floor Takeover
--     (premium common-area placement the show controls, USD 40-65k) and
--     In-Booth Machine (exhibitor's own stand, USD 25-40k). The old single
--     product was ambiguous about who owns the placement.
--   * Presets rebuilt shows-first so no count implies an impossible floor
--     plan: exactly one Rebooking Engine and one Registration Takeover per
--     show, at most a few floor takeovers. Pilot = 2 shows (12 machines),
--     Scale = 4 shows (28), Portfolio = 6 shows (48); ad slots assume a
--     two-thirds sell-through of the derived ceiling, never a sell-out.
--
-- The canonical TypeScript config lives in src/lib/informa/deal.ts; this
-- JSON is generated from it.

update public.partner_pricing_pages set
  config = '{
  "currency": "USD",
  "split": {
    "brightBlue": 0.7,
    "partner": 0.3
  },
  "commitment": {
    "pilotMinUnits": 12,
    "pilotMaxUnits": 15,
    "maxUnits": 50,
    "cutoffWeeks": 25
  },
  "levers": [
    {
      "key": "arrival",
      "label": "Registration Takeover",
      "unitsPerItem": 1,
      "note": "One per show — there is only one front door, which is why it commands the top of the rate card. A count of 4 means 4 shows. Screens carry that sponsor''s brand alone.",
      "retail": {
        "min": 50000,
        "max": 75000,
        "suggested": 60000,
        "step": 1000
      }
    },
    {
      "key": "floor",
      "label": "Show-Floor Takeover",
      "unitsPerItem": 1,
      "note": "A sponsor machine in a premium common area you control — a main aisle, a lounge, the F&B queue. Realistically two or three of these spots exist per show; the scarcity is what the price buys. Screens carry the sponsor''s brand alone.",
      "retail": {
        "min": 40000,
        "max": 65000,
        "suggested": 50000,
        "step": 1000
      }
    },
    {
      "key": "booth",
      "label": "In-Booth Machine",
      "unitsPerItem": 1,
      "note": "Sold to exhibitors for their own stands — the volume product, since any booth big enough can take one. The exhibitor already owns the space; they buy the machine, the game and the lead flow. Screens carry the sponsor''s brand alone.",
      "retail": {
        "min": 25000,
        "max": 40000,
        "suggested": 30000,
        "step": 1000
      }
    },
    {
      "key": "rebooker",
      "label": "Rebooking Engine",
      "unitsPerItem": 1,
      "revenue": "service",
      "note": "Exactly one per show, on your own booth — the count here doubles as the show count. A flat service fee you pay, not split revenue. Its screens are yours, so they host Screen Ad Network slots.",
      "retail": {
        "min": 35000,
        "max": 50000,
        "suggested": 40000,
        "step": 1000
      }
    },
    {
      "key": "media-unit",
      "label": "House Media Unit",
      "unitsPerItem": 1,
      "note": "A show-branded machine you place in a high-footfall spot — one or two per show. It carries no line price of its own: it exists to host Screen Ad Network slots, and it counts toward the fleet and the floor ladder like any other machine.",
      "retail": {
        "min": 0,
        "max": 0,
        "suggested": 0,
        "step": 500
      }
    },
    {
      "key": "loop",
      "label": "Screen Ad Network",
      "unitsPerItem": 0,
      "slotSource": {
        "slotsPerUnit": 6,
        "sourceLevers": [
          "rebooker",
          "media-unit"
        ]
      },
      "note": "Six 10-second slots per show-controlled machine: rebooking engines and house media units. A machine sold to one sponsor carries that sponsor''s brand alone, so its screens are never in this inventory.",
      "retail": {
        "min": 3000,
        "max": 8000,
        "suggested": 5000,
        "step": 500
      }
    }
  ],
  "floorTiers": [
    {
      "label": "Pilot",
      "minUnits": 1,
      "maxUnits": 15,
      "floor": 15000
    },
    {
      "label": "Scale",
      "minUnits": 16,
      "maxUnits": 30,
      "floor": 13500
    },
    {
      "label": "Portfolio",
      "minUnits": 31,
      "maxUnits": 50,
      "floor": 12000
    }
  ],
  "presets": [
    {
      "key": "pilot",
      "label": "Pilot",
      "description": "Two shows, six machines each: registration, one floor takeover, two in-booth machines, your rebooker and a media unit per show. 16 of 24 ad slots sold.",
      "counts": {
        "arrival": 2,
        "floor": 2,
        "booth": 4,
        "rebooker": 2,
        "media-unit": 2,
        "loop": 16
      }
    },
    {
      "key": "scale",
      "label": "Scale",
      "description": "Four shows, seven machines each once the pilot proves out — a second floor takeover joins per show. 32 of 48 ad slots sold.",
      "counts": {
        "arrival": 4,
        "floor": 8,
        "booth": 8,
        "rebooker": 4,
        "media-unit": 4,
        "loop": 32
      }
    },
    {
      "key": "portfolio",
      "label": "Portfolio",
      "description": "Six shows, eight machines each across the calendar — a third in-booth machine joins per show. 48 of 72 ad slots sold.",
      "counts": {
        "arrival": 6,
        "floor": 12,
        "booth": 18,
        "rebooker": 6,
        "media-unit": 6,
        "loop": 48
      }
    }
  ]
}'::jsonb,
  hero = '{
  "title": "The Bright.Blue line for the Informa portfolio",
  "subtitle": "Five plain-named products your reps can sell straight off the rate card, running on one set of commercial rails. The numbers below are live: build the mix you would actually sell and watch what the program earns.",
  "explorerNote": "Counts are portfolio-wide totals, and every scenario is built shows-first from a recipe a real floor plan can hold: one registration takeover and one rebooking machine per show, a couple of premium floor takeovers, in-booth machines as demand allows. The Rebooking Engine count doubles as the show count. Start from a scenario, then drag anything.",
  "links": [
    {
      "label": "Rate card & seller''s kit",
      "href": "/informa/kit"
    },
    {
      "label": "Sample proof-of-performance report",
      "href": "/informa/report"
    },
    {
      "label": "Partnership deck",
      "href": "/informa"
    }
  ]
}'::jsonb
where slug = 'informa-portfolio-e1820d252a4f';

-- Rollback: re-run 20260818210000_informa_portfolio_pricing_page.sql.
