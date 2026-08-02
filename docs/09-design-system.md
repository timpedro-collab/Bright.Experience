# Bright.Experience Design System

Premium, calm, intentional. The portal is a sibling to bright.blue, not a clone of it — it speaks the same language but in a quieter voice, because customers come here to track delivery, not to be sold to.

This doc is the canonical reference for everyone landing fresh on the codebase. If something on screen contradicts what's here, the screen is wrong, not the doc.

---

## 1. The locked palette

These five colours never change. Everything else in the system is a derived semantic token.

| Token | Hex | Role |
|-------|-----|------|
| `--color-bb-cobalt` | `#1E47F0` | Brand primary. Links, focused states, "active" highlights, brand CTAs. |
| `--color-bb-cyan` | `#80E8FF` | Live / "in flight". Used for the live event lane and the live status dot. |
| `--color-bb-deep-ink` | `#060720` | Deep Ink ground (default authenticated theme). |
| `--color-bb-linen` | `#F2EDE0` | Linen ground (light theme — proposal brochure, print). |
| `--color-bb-paper` | `#FAF7F0` | Linen card surface (one shade lighter than Linen). |

Status semantics layer on top:

| Variable | Use |
|----------|-----|
| `--success` (`hsl(143 72% 42%)`) | "Done", "approved", "complete", "green". |
| `--warning` (`hsl(43 90% 56%)`) | "Awaiting", "amber", "pending". |
| `--destructive` (`hsl(0 84% 60%)`) | "Blocked", "rejected", "red". |
| `--info` (`hsl(223 94% 53%)`) | "In progress", "in production". |

---

## 2. Themes

The portal supports two themes, picked via a class on `<html>`:

- **Deep Ink** — default, no class needed. Sets the deep-ink ground, cobalt accents, soft white text, dim hairlines.
- **Linen** — add `class="theme-light"` on `<html>`. Sets the linen ground, deep-ink text, warmer hairlines, paper card surfaces.

Both modes consume the same semantic tokens (`--background`, `--card`, `--border`, `--foreground`, `--muted-foreground`). **Never hard-code a colour in a component** — always read a semantic token so the component flips correctly when the theme switches.

`EditionShell` accepts a `theme` prop (`"dark" | "light" | undefined`) and writes the class on its wrapper, so a single component can be requested in either mode.

---

## 3. Typography

Three faces, all owned by the brand:

| Face | Use | Token |
|------|-----|-------|
| **Nunito Bold** | Headings, display, page titles, hero | `--font-heading` / `text-heading` / `text-display` |
| **DM Sans Regular** | Body, paragraphs, default text | `--font-body` |
| **DM Sans Medium** | Eyebrows, overlines, metadata, tabular nums | `--font-overline` / `text-overline` |
| **Clash Display (variable)** | *Public marketing surfaces only* — homepage/catalog hero + section headlines | `--font-display-grotesk` / `text-display-grotesk` |

The font files live in `src/lib/fonts/` and are wired up in `src/app/layout.tsx`. **Don't add a new font** — this is the budget. Clash Display (Fontshare Free Font License, `src/lib/fonts/LICENSE-clash-display.txt`) replaced the Fraunces serif in Aug 2026 to match the cutting-edge positioning; it is `preload: false` and must never appear inside the portal: it is the marketing voice, not the product voice (docs/18-design-research.md H5).

### Text-grey ramp (Aug 2026)

Four steps, Linear-style, so a dense row can carry title / subtitle / metadata / timestamp without competition:

| Class | Role |
|-------|------|
| `text-foreground` | Title |
| `text-muted-foreground` | Subtitle / secondary |
| `.text-tertiary` | Metadata |
| `.text-quaternary` | Timestamps, trailing hints |

Per-size tracking utilities `.text-ui-15` / `.text-ui-14` / `.text-ui-13` pair small UI sizes with their correct letter-spacing.

### Type scale

| Class | Use |
|-------|-----|
| `text-display` | Page-hero titles (the one big statement). Pair with `clamp()` font sizing. |
| `text-heading` | Section titles, card titles. |
| `text-base` / `text-sm` | Body / secondary body. |
| `text-overline` | Anywhere we'd otherwise use an `<h6>` or a small label. Uppercase, tracked, DM Sans Medium. |

---

## 4. Radii, shadows, motion

There are exactly three legal radii. Use a CSS variable, never an ad-hoc `rounded-2xl`:

| Variable | Use |
|----------|-----|
| `--radius-chip` | Chips, pills, badges. ~9999px (fully pill). |
| `--radius-control` | Buttons, inputs, small interactive controls. |
| `--radius-card` | Cards, panels, big surfaces. |

Shadows live as variables too — `--bb-shadow-card`, `--bb-shadow-premium`, `--bb-shadow-float`, `--bb-shadow-glow`. Reach for the variable instead of hand-rolling a `shadow-[...]`.

Motion is restrained. The two durations you'll use are `--bb-duration-fast` (~120ms) and `--bb-duration-base` (~200ms), both with `--bb-ease-standard` for the easing. Anything more than that needs justification.

### Expressive motion (Aug 2026 design build — marketing + one-shot reveals only)

| Token | Value | Use |
|-------|-------|-----|
| `--bb-ease-expressive` | `cubic-bezier(0.16,1,0.3,1)` | Hero/section entrances |
| `--bb-ease-sheet` | `cubic-bezier(0.32,0.72,0,1)` | Sheets/drawers |
| `--bb-duration-reveal` | 600ms | Scroll-reveal entrances |
| `--bb-duration-hero` | 900ms | One element per page, maximum |
| `--bb-stagger-*` | 20/30/40ms | Stagger steps |

Shared primitives: `Reveal` / `RevealGroup` / `RevealItem` (`src/components/ui/motion.tsx`), `StatCountUp` (`src/components/ui/StatCountUp.tsx`), `useInViewClass` (mobile hover-parity), `useStableStatus` (debounces threshold-derived status colours on polled dashboards — never let a status dot strobe). The case-study tile choreography lives under `.cs-tile` in `globals.css`.

**Reduced motion is three-layered**: `MotionConfig reducedMotion="user"` at the root for Framer Motion, duration-variable zeroing in `globals.css` for CSS, and `useReducedMotion()` guards inside every `requestAnimationFrame` loop. New rAF loops must add the guard.

**Never** scroll-reveal portal lists — entrance animation belongs to genuinely new content only (live feed items).

---

## 5. Page chassis

Every authenticated page is composed from the same set of primitives. If you're tempted to bypass them, the answer is almost always "no — extend the shell instead".

```
<EditionShell>
  <EditionChrome breadcrumbs={…} rightSlot={…} />
  <RidgeHero seed={…} eyebrow={…} title={…} subtitle={…} rightSlot={…} />
  <EditionBody>
    {/* the actual content */}
  </EditionBody>
  <EditionFooter rightSlot={…} />
  <CommandPalette />
</EditionShell>
```

For convenience, two helper shells wrap the chassis with the right defaults:

- `EventPageShell` — for every `/events/[id]/*` sub-page. Pass `event`, `user`, `unreadCount`, `section`, `title`, `subtitle`, optional `heroRight`/`children`. It builds the breadcrumbs, seeds the ridge, and wires the footer back-link automatically.
- `AdminPageShell` — same shape for `/admin/*` and the internal `/studio` and `/events/new` routes.

Don't compose `EditionShell + EditionChrome + RidgeHero` by hand for new pages — use the helper unless the page is genuinely a one-of-one (e.g. login, the public catalog hero).

---

## 6. Brand primitives (`src/components/brand/`)

| Primitive | Purpose | Notes |
|-----------|---------|-------|
| `RidgeArtwork` | Deterministic SVG ridge fingerprint. The "visual fingerprint" of an event or route. | Pass `seed`, `lines` (default 14), `amplitude` (default 40). Never use it more than once per page (page hero only) — except inside `EditionPlate`, where the ridge represents the sub-route. |
| `EditorialEyebrow` | Tracked uppercase DM Sans Medium label. | Pass `accent` for cobalt. This is the canonical small-heading. |
| `Hairline` | 1px gradient rule between editorial sections. | `orientation="vertical"` for column dividers. |
| `EditionShell` / `EditionChrome` / `RidgeHero` / `EditionBody` / `EditionFooter` | The page chassis. See §5. | |
| `EventPageShell` / `AdminPageShell` | Helper shells. See §5. | |
| `EditionPlate` | Compact card representing one event. Used in event grids, the "your other events" rail, partner dashboards. | Has its own scoped `RidgeArtwork` keyed by `id`. Pass `title`, `meta`, `statusLabel`, `statusTone`, `waitingOnYou`, `href`. |

---

## 7. shadcn primitives — variant cheat sheet

These are the only legitimate vehicles for buttons, cards, badges, inputs. **Never re-implement them.**

### `<Button>`

| Variant | When |
|---------|------|
| `brand` (or `default`) | Primary CTA — gradient cobalt with premium shadow. |
| `glass` | Secondary CTA — transparent with hairline border. |
| `ghost` | Tertiary CTA — text-only with subtle hover. |
| `outline` | Form-adjacent buttons (cancel, back). |
| `destructive` | Irreversible / dangerous action. |
| `link` | Inline text-only link button. |

Sizes: `xs`, `sm`, `default`, `lg`, `xl`, `icon`.

### `<Card>`

Props:

- `tone` — `glass` (default), `subtle`, `elevated`, `outline`, `default`. **Max one `glass` per page.**
- `interactive` — adds hover lift + focus ring. Use when the card is a link or button.

### `<Badge>`

| Variant | When |
|---------|------|
| `success` | Green / "done" / "live OK". |
| `warning` | Amber / "awaiting" / "at risk". |
| `destructive` | Red / "blocked". |
| `info` | Blue / "in progress". |
| `muted` | Neutral / "upcoming" / "skipped". |
| `outline` | Bare hairline border, no fill. |
| `secondary` | Subtle filled. |

### `<Input>` / `<Textarea>` / `<Label>`

Straight shadcn — no wrappers needed. They already consume the design tokens, so theme switches just work.

---

## 8. Banned patterns

These all existed at some point during build and were removed. If a future PR re-introduces them, that's a regression.

- **No legacy `.btn` / `.card` / `.badge` / `.badge-green|amber|red|blue|muted` / `.input` CSS classes.** Removed May 2026. Use shadcn primitives.
- **No "book / chapters / edition" metaphor.** Removed May 2026 — the editorial system is the design language, but the language describing what's on screen is "events", "stages", "milestones", "next step". No "Edition No024", no "The Chapters", no Roman-numeralled stage lists.
- **No ad-hoc `rounded-2xl` / `rounded-3xl`.** Use the three radii variables.
- **No `bg-clip-text` outside the brand mark.**
- **No more than one decorative blur orb per page** — and prefer `RidgeArtwork` over orbs.
- **No emoji in UI** unless the user explicitly adds them.
- **No hand-rolled hex colours in components.** Always read a CSS variable.

---

## 9. Where to look first when adding a new surface

- **New event sub-page?** → Use `EventPageShell`. Mirror an existing sibling page (e.g. `/events/[id]/timeline`).
- **New admin page?** → Use `AdminPageShell`. Mirror an existing admin page.
- **New public marketing surface?** → Wrap the body in a hero section with `RidgeArtwork` + `EditorialEyebrow`, then a `Container` + `Section`. Mirror `/catalog`, `/proposal`, or `/quiz`.
- **New small UI need?** → Reach for `@/components/ui/*` (shadcn) first, brand primitives second, then ask "should this be a brand primitive?" before hand-rolling.
