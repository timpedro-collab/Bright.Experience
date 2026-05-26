/**
 * RidgeArtwork — the signature generative SVG that gives every event /
 * edition its own unique visual fingerprint.
 *
 * Looks like a flowing topographic ridge / woven contour field of thin
 * cobalt lines on the surface, with ONE brighter cyan "hero thread"
 * undulating diagonally across the whole composition.
 *
 * The artwork is fully deterministic: passing the same `seed` always
 * produces the same drawing, so an event's ridge is a stable visual
 * identity that can appear at any size (hero header, library thumbnail,
 * proposal cover). The same DNA strand running through every surface.
 *
 * Theme-aware: the ridges use `currentColor` (cobalt brand token) and
 * the hero thread uses `var(--color-bb-cyan)`, so the artwork looks
 * right on both Deep Ink and Linen surfaces without props.
 *
 * Why SVG (not canvas / WebGL):
 *   - Crisp at any zoom
 *   - Cheap to render server-side (no hydration jank)
 *   - Theme switches via CSS variables, no re-draw
 *   - Accessible (we add `role="presentation"` so screen readers skip it)
 */
import * as React from "react";
import { cn } from "@/lib/utils";

interface RidgeArtworkProps extends React.SVGAttributes<SVGSVGElement> {
  /**
   * Stable identifier (event id, edition slug, etc) that becomes the
   * generative seed. Two events with the same seed get the same ridge.
   * Omit for a default brand ridge.
   */
  seed?: string;
  /**
   * Number of cobalt ridge lines. More = denser / woven, fewer = sparser /
   * mountainous. Default 28 is the editorial sweet spot.
   */
  lines?: number;
  /**
   * Visual density of the noise field. Higher = more peaks per ridge.
   */
  amplitude?: number;
  /**
   * Render the brighter cyan "hero thread" diagonal across the ridges.
   * Default true. Disable for small library thumbnails to keep things
   * legible.
   */
  showHeroThread?: boolean;
  /**
   * Stroke width of each ridge line, in viewBox units (1000x500).
   */
  strokeWidth?: number;
  className?: string;
}

const DEFAULT_SEED = "bright.blue";
const VIEW_W = 1000;
const VIEW_H = 500;

/**
 * Hash a string to a stable 32-bit unsigned integer seed.
 * Uses FNV-1a — fast, no deps, good distribution for short strings.
 */
function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Seeded PRNG (mulberry32) — produces a deterministic uniform random
 * stream from a 32-bit seed. Same seed always replays the same sequence.
 */
function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Build a single ridge path: a smooth cubic-bezier line that flows left
 * to right across the viewBox. The base Y position is `baseY`; we
 * perturb it with low-frequency sinusoidal noise + per-control-point
 * random offsets so each ridge has its own personality.
 */
function buildRidgePath(
  rng: () => number,
  baseY: number,
  amplitude: number,
  controlPoints: number,
  ridgeIndex: number,
): string {
  const step = VIEW_W / controlPoints;
  const phase = rng() * Math.PI * 2;
  const freq = 1.4 + rng() * 1.6;
  const wobble = (x: number) => {
    const u = x / VIEW_W;
    // Two-octave sine + noise: lower amplitude at edges (window function)
    // so ridges feel "framed" rather than crashing off the edge.
    const envelope = Math.sin(u * Math.PI);
    const base =
      Math.sin(u * Math.PI * 2 * freq + phase + ridgeIndex * 0.18) * 0.65 +
      Math.sin(u * Math.PI * 5.3 + phase * 1.7 + ridgeIndex * 0.31) * 0.35;
    const jitter = (rng() - 0.5) * 0.3;
    return (base + jitter) * amplitude * envelope;
  };

  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= controlPoints; i++) {
    const x = i * step;
    points.push({ x, y: baseY + wobble(x) });
  }

  // Build a smooth path with cubic Bezier handles inferred from neighbors.
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const tension = 0.22;
    const c1x = p1.x + (p2.x - p0.x) * tension;
    const c1y = p1.y + (p2.y - p0.y) * tension;
    const c2x = p2.x - (p3.x - p1.x) * tension;
    const c2y = p2.y - (p3.y - p1.y) * tension;
    d +=
      ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)},` +
      ` ${c2x.toFixed(2)} ${c2y.toFixed(2)},` +
      ` ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

/**
 * Build the brighter "hero thread" — a single cyan path that traces a
 * gentle diagonal across the composition, undulating in sympathy with
 * the ridges. It's the visual hook that says "this is THIS edition" —
 * different seed = different path of travel.
 */
function buildHeroThread(rng: () => number): string {
  const startY = VIEW_H * (0.18 + rng() * 0.18);
  const endY = VIEW_H * (0.62 + rng() * 0.22);
  const points = 12;
  const step = VIEW_W / points;
  const path: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= points; i++) {
    const u = i / points;
    const linear = startY + (endY - startY) * u;
    const wave =
      Math.sin(u * Math.PI * 3.4 + rng() * 0.4) * 18 +
      Math.sin(u * Math.PI * 7.1) * 6;
    path.push({ x: i * step, y: linear + wave });
  }
  let d = `M ${path[0].x.toFixed(2)} ${path[0].y.toFixed(2)}`;
  for (let i = 0; i < path.length - 1; i++) {
    const p0 = path[i - 1] ?? path[i];
    const p1 = path[i];
    const p2 = path[i + 1];
    const p3 = path[i + 2] ?? p2;
    const tension = 0.25;
    const c1x = p1.x + (p2.x - p0.x) * tension;
    const c1y = p1.y + (p2.y - p0.y) * tension;
    const c2x = p2.x - (p3.x - p1.x) * tension;
    const c2y = p2.y - (p3.y - p1.y) * tension;
    d +=
      ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)},` +
      ` ${c2x.toFixed(2)} ${c2y.toFixed(2)},` +
      ` ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

export const RidgeArtwork = React.forwardRef<SVGSVGElement, RidgeArtworkProps>(
  (
    {
      seed = DEFAULT_SEED,
      lines = 28,
      amplitude = 90,
      showHeroThread = true,
      strokeWidth = 1,
      className,
      ...props
    },
    ref,
  ) => {
    const paths = React.useMemo(() => {
      const rng = mulberry32(hashSeed(seed));
      // Pre-warm the PRNG so neighboring seeds don't produce neighboring art.
      for (let i = 0; i < 8; i++) rng();

      const ridges: string[] = [];
      const verticalPadding = 60;
      const usableH = VIEW_H - verticalPadding * 2;
      for (let i = 0; i < lines; i++) {
        const baseY = verticalPadding + (i / (lines - 1)) * usableH;
        ridges.push(buildRidgePath(rng, baseY, amplitude, 14, i));
      }
      const heroThread = showHeroThread ? buildHeroThread(rng) : null;
      return { ridges, heroThread };
    }, [seed, lines, amplitude, showHeroThread]);

    return (
      <svg
        ref={ref}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        role="presentation"
        aria-hidden="true"
        className={cn(
          "block w-full h-full text-[hsl(var(--ridge-color,_223_94%_53%))]",
          className,
        )}
        {...props}
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={0.55}
        >
          {paths.ridges.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        {paths.heroThread && (
          <path
            d={paths.heroThread}
            fill="none"
            stroke="var(--color-bb-cyan)"
            strokeWidth={strokeWidth * 1.8}
            strokeLinecap="round"
            opacity={0.95}
          />
        )}
      </svg>
    );
  },
);
RidgeArtwork.displayName = "RidgeArtwork";
