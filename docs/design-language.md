# The Ink Design Language

**This is the binding style contract for every Bright.Experience surface.**
If you are an engineer (or agent) restyling any page or component, read this
document top to bottom before touching code. When this document and older
docs disagree, this document wins.

Origin: the JCDecaux keynote deck (`jcdecaux-presentation` repo,
`src/theme.ts`). The app expresses the same vocabulary at product scale.

---

## 1. The two themes

One design language, two expressions. Both are first-class.

| | **Ink (default)** | **Ink Light (toggle)** |
|---|---|---|
| Canvas | `#050519` near-black blue | `hsl(228,36%,97%)` blue-white paper |
| Cards | translucent white (4% alpha) | solid white |
| Hairlines | `rgba(255,255,255,0.10)` | `hsl(229,26%,89%)` |
| Text | white / 64% white / 40% white | deep blue-ink / cool grays |
| Accent cyan | `#00BFE8` | `hsl(191,100%,32%)` (darkened for contrast) |
| Corner glows | full bloom (0.24 / 0.13 alpha) | whisper (0.08 / 0.05 alpha) |

- Ink is the **app default** — the `:root`/`@theme` values in
  `src/app/globals.css`. No class needed.
- Ink Light is applied by the `.theme-light` class, toggled on `<html>` by
  `ThemeProvider` (persisted as `bright.theme` in localStorage).
- `.theme-dark` is a **force-Ink scope**: it pins a subtree to Ink even when
  the user is in Ink Light. Reserved for cinematic surfaces (decks, login
  hero, tour overlays, wrapped report, `/pp/*`, public footer). Never use it
  as a styling shortcut.
- The old "Cloud Slate" dark palette and "cool-white" light palette are
  retired. Do not reintroduce their values.

## 2. Hard rules (non-negotiable)

1. **Semantic tokens only.** `bg-background`, `bg-card`, `text-foreground`,
   `text-muted-foreground`, `border-border`, `bg-popover`, etc. Never
   `bg-white`, `bg-black`, `text-slate-*`, `text-gray-*`, `bg-zinc-*`, or
   arbitrary hex/hsl values (`bg-[#0b0f30]`, `text-[hsl(...)]`) for anything
   the theme should control. If a color must be literal (photography
   overlays, brand logo chips), leave a comment saying why.
2. **Verify in BOTH themes.** Any page you restyle must be looked at in Ink
   and in Ink Light before you call it done.
3. **Status colors are information, never decoration.** Success, warning,
   destructive, info tones stay solid semantic colors (`text-success`,
   `bg-warning/15`, …). Never replace a status color with the brand
   gradient, and never invent new status hues — use the `StatusBadge` /
   `StatusPill` patterns.
4. **The accent budget: one gradient accent per visual zone.** A hero gets
   one gradient phrase OR one gradient chip — not both. A card row gets at
   most one gradient element. When everything glows, nothing does.
5. **Don't touch the foundation.** `src/app/globals.css`,
   `src/components/ui/*`, `src/components/brand/*`, `src/components/cloud/*`,
   `src/components/layout/*`, `ThemeProvider` are owned by the foundation
   track. If your surface needs a foundation change, report it — don't edit.
6. **Keep-light surfaces stay light.** See §8.
7. **Scrims over photography stay literal.** `bg-black/80` overlay gradients
   on photos/videos are correct in both themes — don't tokenize them.

## 3. Vocabulary — how the language is spoken

### Eyebrows
Small tracked-uppercase section labels, the deck's signature.
```tsx
<EditorialEyebrow accent>Live now</EditorialEyebrow>   // cyan accent
<EditorialEyebrow>Quiet label</EditorialEyebrow>       // muted
```
Or raw: `className="text-overline text-brand-cyan"`. The `text-brand-cyan`
utility is theme-aware (bright `#00BFE8` on Ink, darkened on paper).

### Gradient statements
The cobalt→cyan gradient (`--color-bb-cobalt` → `--color-brand-cyan`,
120deg) is the brand's voice. Two sanctioned utilities:
```tsx
<h1>Welcome back, <span className="text-brand-gradient">Tim</span></h1>
<span className="chip-brand-gradient rounded-full px-2 py-0.5">3 new</span>
```
- `.text-brand-gradient` — gradient-filled text. Use on ONE emphasized
  phrase in a hero/title, or a key metric. Never on body copy, never on
  status text.
- `.chip-brand-gradient` — gradient-filled chip/icon-wrap with white
  foreground. Used for the "this is the active/featured thing" signal
  (active nav item, featured icon chip).
- Primary buttons already carry the gradient via `<Button variant="brand">`
  (or `default`) — don't gradient anything else in the same zone as a
  primary CTA.

### Ambient glows
`.ink-glows` on a page-scale wrapper adds the deck's corner glows
(cobalt top-right, cyan bottom-left), automatically muted in Ink Light.
`EditionShell` already applies it — don't stack a second one inside.

### Hairlines & cards
- Section separation: `<Hairline />` (1px gradient rule), not heavy borders.
- Cards: `bg-card` + `border-border` (`<Card>`, or `rounded-[var(--radius-card)] border border-border bg-card`).
  On Ink this renders the deck's translucent-white panel; on paper, a white
  card. Never hand-roll `bg-white/[0.04]` — that's what `bg-card` IS on Ink.
- Glass: `.glass` / `.glass-subtle` / `.glass-strong` utilities are
  theme-aware. Public marketing surfaces may use them; portal pages prefer
  flat `bg-card`.

### Typography
Unchanged: `.text-heading` (Nunito), `.text-body`, `.text-overline`
(DM Sans), `.text-display-grotesk` (Clash Display, public marketing only).
The four-step ramp (`text-foreground` → `text-muted-foreground` →
`.text-tertiary` → `.text-quaternary`) is theme-aware.

## 4. Token reference

Everything below remaps automatically under `.theme-light` and `.theme-dark`.

| Token / utility | Ink value | Ink Light value |
|---|---|---|
| `bg-background` | `hsl(240,67%,6%)` #050519 | `hsl(228,36%,97%)` |
| `text-foreground` | white | `hsl(233,60%,10%)` |
| `bg-card` | `rgba(255,255,255,0.04)` | white |
| `bg-popover` | `hsl(240,45%,10%)` solid | white |
| `bg-secondary` / `bg-muted` | 7% / 6% white | `hsl(228,32%,94%)` |
| `text-muted-foreground` | 64% white | `hsl(233,14%,40%)` |
| `border-border` | 10% white | `hsl(229,26%,89%)` |
| `border-input` | 12% white | `hsl(229,26%,86%)` |
| `bg-primary` | cobalt (both) | cobalt |
| `text-brand-cyan` | `#00BFE8` | `hsl(191,100%,32%)` |
| `bg-primary-tint` | `hsl(230,60%,18%)` | `#E8EEFF` |
| `text-success` / `warning` / `info` | shared | shared |
| `bg-sidebar` | `hsl(240,67%,4%)` | white |

Status recipes (from `StatusBadge.tsx` — copy these, don't invent):
`bg-success/15 text-success border-success/30`,
`bg-warning/15 text-warning border-warning/30`,
`bg-destructive/15 text-destructive border-destructive/30`,
`bg-primary/15 text-primary border-primary/30`,
`bg-info/15 text-info border-info/30`,
`bg-muted text-muted-foreground border-border`.

## 5. Charts & dataviz

- Recharts colors are SVG attributes — CSS vars don't resolve. Always use
  `useChartColors()` from `src/components/cloud/ChartCard.tsx`; it reads
  live tokens off `<html>` and re-reads on theme change.
- Series order: `colors.primary` (cobalt) first, `colors.accent`
  (theme-aware cyan) second. Grid `colors.grid`, axes `colors.axis`,
  tooltips `colors.tooltipBg` / `colors.tooltipBorder` (solid popover —
  never the translucent card token).
- Gradient fills under area charts: cobalt at ~35% alpha fading to 0 —
  keep them subtle so data stays readable in both themes.
- Never hardcode chart hex values or Tailwind palette colors (`#0ea5e9`,
  `emerald-500`) in chart configs.

## 6. Iconography, logos, imagery

- Lucide icons inherit `currentColor` — give them a token color class.
- Client/partner logos that are dark-ink SVGs are invisible on Ink: wrap
  them in a light chip (`rounded-md bg-white/90 p-1.5`) or use a
  CSS-inverted variant. (C8 owns the systematic fix.)
- Brand wordmark: use the light-on-dark variant on Ink, dark-on-light in
  Ink Light — pick via CSS (`.theme-light` visibility swap), not JS.
- Photography needs a scrim before text sits on it:
  `linear-gradient` of `rgba(5,5,25,…)` exactly like the deck covers.

## 7. Motion

Existing motion tokens stay (`--bb-ease-*`, `--bb-duration-*`,
`connect-*`, stagger, mesh-drift). Gradient/glow elements must not pulse or
animate on server-rendered lists. Respect `prefers-reduced-motion`
(already global). `status-pulse` and `live-value-pulse` keep their semantic
colors.

## 8. Keep-light surfaces (explicitly out of scope)

These render light regardless of user theme — they apply `.theme-light`
locally (or are plain HTML) and must NOT be inked:

- `src/app/(print)/*` — report slides, live QR posters
- `src/app/events/[id]/reports/print/` and `/live/print/`
- Organizer one-pager / prospectus / spec sheets, venue earnings statement
- `api/*` OG-image routes, `PdfCanvas`, PDF exports
- Email HTML (`src/lib/email.ts`, `dispatch.ts`, `journeys.ts`)

The sample-report PDF and deal-quote sheet are already dark **by design**
(they mirror the Informa suite) — leave them.

## 9. Verification duty (every agent, every surface)

1. `npm run lint` and `npm run typecheck` clean on your files.
2. Run your domain's tests; update class-coupled assertions to the new
   token classes (behavior-preserving — don't delete tests).
3. Screenshot your key pages in BOTH themes (dev server, mock login
   `tim@brightblue.co.uk` / `brightblue`; toggle via
   `localStorage.setItem('bright.theme','light')` + reload) and actually
   look at them: contrast, unreadable text, invisible logos, broken
   charts, white flashes.
4. Grep your manifest for leftovers before finishing:
   `rg -n "bg-white|slate-|gray-|zinc-|#[0-9a-fA-F]{3,8}" <your files>`
   — every remaining hit must be a justified literal (scrim, logo chip,
   keep-light surface) with a comment.
