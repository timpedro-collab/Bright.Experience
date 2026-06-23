# Assets needed for the demo — handoff for Theo

This is the focused list of **visual assets (images + video)** and the **creative‑upload wiring** still needed to take the Bright.Experience demo from "structurally complete" to "fully dressed."

Everything below is already wired in code — each item has a clear home and a graceful fallback, so **nothing is broken right now**; the app shows tasteful gradient/monogram placeholders wherever a real asset hasn't been supplied. Dropping the real files in (and, where noted, flipping one field back on) is all that's required.

> **Convention:** static marketing assets live in `/public/...` and are referenced by an absolute path (e.g. `/catalog/foo.jpg` → `public/catalog/foo.jpg`). Per‑event creative uploads go through the live upload pipeline into Supabase Storage (see §5).

---

## Priority 0 — visible in the core demo flow (do these first)

### 1. Machine hero images (catalog)
- **Where referenced:** `src/lib/supabase/mock/dataset.ts` → `machines[].hero_image_url` (currently `null` → gradient fallback with the machine name).
- **To enable:** drop the files below into `public/catalog/` and set each machine's `hero_image_url` to the matching path.

| Machine | File to supply | Suggested spec |
|---|---|---|
| Experience Portal Compact | `/catalog/experience-portal-compact-hero.jpg` | Product shot, clean/neutral bg, ≥1600px wide |
| Experience Portal | `/catalog/experience-portal-hero.jpg` | " |
| Experience Portal XL | `/catalog/experience-portal-xl-hero.jpg` | " |
| Experience Portal Studio | `/catalog/experience-portal-studio-hero.jpg` | " |

- **Card rendering:** `src/components/catalog/MachineCard.tsx` (tall tile, dark gradient overlay at the bottom — keep the focal point in the upper two‑thirds).

### 2. Case‑study hero images (catalog + landing case‑study rail)
- **Where referenced:** `src/lib/supabase/mock/dataset.ts` → `case_studies[].hero_image_url` (currently `null` → gradient fallback). Mirror any changes in `supabase/seed.sql` (same five rows) if you want the SQL seed to match.
- **Card rendering:** `src/components/catalog/CaseStudyCard.tsx` (16:10, bottom gradient + client name overlay); detail page `src/app/(public)/catalog/case-studies/[slug]/page.tsx`.
- **To enable:** drop the files into `public/case-studies/` and set each study's `hero_image_url` to the matching path.
- These are the five **real** clients we want to feature — cover photos only; all copy/stats are already written.

| Case study | Slug | File to supply |
|---|---|---|
| Costa Coffee | `costa-matcha-launch` | `/case-studies/costa-hero.jpg` |
| BIBA | `biba-conference` | `/case-studies/biba-hero.jpg` |
| Pelion | `pelion-expo` | `/case-studies/pelion-hero.jpg` |
| Storyblok | `storyblok-dmexco` | `/case-studies/storyblok-hero.jpg` |
| Adyen | `adyen-event-gifting` | `/case-studies/adyen-hero.jpg` |

### 3. Client logos — "Trusted by" wall
- **Where referenced:** `src/lib/marketing/client-logos.ts`.
- **Status:** 6 logos present (Storyblok, Adyen, Red Bull, Porsche, Suntory, Celsius). 4 are showing the **monogram fallback** because their files aren't in the repo yet.
- **To enable:** drop transparent PNG/SVG (white‑silhouette safe — the strip applies `brightness-0 invert`) into `public/logos/` and re‑add the `src` for:

| Brand | File to supply |
|---|---|
| Pepsi | `/logos/pepsi.png` |
| Lucozade | `/logos/lucozade.png` |
| Pelion | `/logos/pelion.png` (keep `imgClassName: "max-h-11"`) |
| Intact | `/logos/intact.png` |

### 4. Creative proof imagery (the asset‑approval + annotation demo)
These are the on‑screen creatives that render inside the **machine mockup** and the **annotatable proof viewer** for the Coca‑Cola demo event. They are click‑to‑open (preview dialog / annotation view), so they don't show as broken in the default views — but if you demo the customer/creative approval flow, supply these so real creative appears on the machine screen.
- **Where referenced:** `src/lib/supabase/mock/dataset.ts` → `assets[].file_url` / `asset_versions[].preview_url`.
- **Renders in:** `src/components/assets/MachinePreview.tsx` (screen overlay) and `src/components/assets/AnnotatablePreview.tsx`.

| File to supply | Used as |
|---|---|
| `/catalog/case-studies/costa-matcha/01-girl-tapping-screen.png` | Game page banner proof |
| `/catalog/case-studies/costa-matcha/02-winner-qr-scan.png` | Home banner proof |
| `/catalog/case-studies/costa-matcha/03-prize-selection.png` | Home‑banner / prize art |
| `/catalog/case-studies/costa-matcha/04-winners-matchilda.png` | Packshot proof |
| `/catalog/case-studies/costa-matcha/05-tap-to-start.png` | Payment‑screen proof |
| `/catalog/case-studies/costa-matcha/06-full-setup-queue.png` | Setup/queue photo |
| `/uploads/coca-cola-logo.svg` | Accepted primary‑logo asset |
| `/previews/samsung-wrap-v2.png` | Samsung wrap proof preview |

> Screen creatives are portrait (≈1080×1920); banners are wide strips — exact per‑slot specs are listed live on each event's **Assets** page.

---

## Priority 1 — richer storytelling (nice for the demo, not blocking)

### 5. Machine demo videos
- **Where:** `src/lib/supabase/mock/dataset.ts` → `machines[].video_url` (currently `null`).
- Short looping MP4 of each machine in action; renders on the machine detail page when present.

### 6. Example creative for the "upload" slots
The demo event has empty upload slots (Idle Screen Advert, Game Prompt Video, Negative Icons, etc.) shown on the customer **Assets** page. To demo the upload → preview experience live, have a couple of example files ready to drop in:
- Idle Screen Advert — MP4, 9:16, 1080×1920, 15–30s.
- Game Prompt Video — MP4, 900×1600, 5–10s.
- Negative Icons (×6) — PNG, 300×300.
(Full spec for each slot is rendered on the page itself.)

---

## Priority 2 — polish

### 7. Partner "Product Demo Reel"
- Linked from the reseller portal Resources (`/api/partner-resources/demo-reel`). A 60–90s sizzle reel would replace the current generated stub.

### 8. Social / OG share images
- Optional `opengraph-image` assets for `/catalog`, `/proposal`, and the public report pages.

---

## 5. Creative‑upload wiring (engineering, not just assets)

The upload feature is **already built end‑to‑end** — you mainly need to point it at a real storage bucket when moving off the mock dataset.

- **Upload UI:** `src/components/assets/AssetUploadZone.tsx` (drag‑drop, live thumbnail, progress).
- **Server action:** `src/app/actions/assets.ts` → `uploadAsset` — validates, optional malware scan, writes to the **`event-assets`** Supabase Storage bucket, stores the storage `file_path` (not a URL) on the asset row.
- **Read path:** `src/lib/storage/signed-url.ts` — every read is signed on demand.
- **To make uploads persist for real:**
  1. Create the private `event-assets` bucket in Supabase Storage.
  2. Set the Supabase env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, service‑role for server actions) and turn off mock mode.
  3. *(Optional)* set `FILE_SCAN_URL` to enable the malware screen (it no‑ops gracefully when unset).
- **Machine screen mockup:** `src/components/assets/MachinePreview.tsx` renders uploaded creative as an on‑screen overlay — worth confirming dimensions / safe areas against the real cabinet art.

---

## What you do NOT need to touch
- **Brand icons** (`/public/brand-icons/*.svg`) and the **6 existing client logos** are already in place.
- **Game tiles** intentionally use a gradient treatment (no per‑game image is expected).
- All venue / quote / report / dashboard data is fully seeded for the demo — no assets required there.
