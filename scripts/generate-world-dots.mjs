/**
 * One-off generator for the deck's dotted world map.
 *
 * Rasterizes Natural Earth land polygons (via the `world-atlas` topojson,
 * dev dependency) into a dot-grid SVG committed at
 * `public/pitch/map/world-dots.svg`. The Informa partnership deck's
 * portfolio slide overlays show markers on this map, positioned with
 * `projectToMapPercent` from `src/lib/informa/portfolio-shows.ts` — the
 * MAP_BOUNDS constants there and here MUST stay identical, and the test
 * next to that module checks the committed SVG's viewBox against them.
 *
 * Run: node scripts/generate-world-dots.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { feature } from "topojson-client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, "../public/pitch/map/world-dots.svg");

// Keep in sync with MAP_BOUNDS in src/lib/informa/portfolio-shows.ts.
// Antarctica and the far north are cropped: no shows there, and the crop
// gives the deck a wider, more cinematic aspect.
const BOUNDS = { west: -180, east: 180, south: -60, north: 75 };

const SVG_WIDTH = 1000;
const SVG_HEIGHT = Math.round(
  (SVG_WIDTH * (BOUNDS.north - BOUNDS.south)) / (BOUNDS.east - BOUNDS.west),
);

/** Grid pitch in degrees — smaller means denser dots and a bigger file. */
const STEP_DEG = 2.1;
const DOT_RADIUS = 2.1;
/** Dim slate-blue on the deck's dark slate; markers overlay in cobalt. */
const DOT_FILL = "#8ca3f0";
const DOT_OPACITY = 0.28;

/** Ray-casting point-in-ring test (even-odd rule). */
function pointInRing(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/** True when the point sits on land: inside an outer ring, outside holes. */
function pointOnLand(lng, lat, geometry) {
  const polygons =
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  for (const rings of polygons) {
    if (!pointInRing(lng, lat, rings[0])) continue;
    let inHole = false;
    for (let i = 1; i < rings.length; i++) {
      if (pointInRing(lng, lat, rings[i])) {
        inHole = true;
        break;
      }
    }
    if (!inHole) return true;
  }
  return false;
}

const topologyPath = resolve(__dirname, "../node_modules/world-atlas/land-110m.json");
const topology = JSON.parse(readFileSync(topologyPath, "utf8"));
const land = feature(topology, topology.objects.land);
const geometry = land.type === "FeatureCollection" ? land.features[0].geometry : land.geometry;

const xForLng = (lng) =>
  ((lng - BOUNDS.west) / (BOUNDS.east - BOUNDS.west)) * SVG_WIDTH;
const yForLat = (lat) =>
  ((BOUNDS.north - lat) / (BOUNDS.north - BOUNDS.south)) * SVG_HEIGHT;

const circles = [];
for (let lat = BOUNDS.south + STEP_DEG / 2; lat < BOUNDS.north; lat += STEP_DEG) {
  for (let lng = BOUNDS.west + STEP_DEG / 2; lng < BOUNDS.east; lng += STEP_DEG) {
    if (!pointOnLand(lng, lat, geometry)) continue;
    const x = xForLng(lng).toFixed(1);
    const y = yForLat(lat).toFixed(1);
    circles.push(`<circle cx="${x}" cy="${y}" r="${DOT_RADIUS}"/>`);
  }
}

const svg = [
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" role="img" aria-label="Dotted world map">`,
  `<g fill="${DOT_FILL}" fill-opacity="${DOT_OPACITY}">`,
  ...circles,
  "</g>",
  "</svg>",
  "",
].join("\n");

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, svg);
console.log(`Wrote ${circles.length} dots to ${OUT_PATH} (${SVG_WIDTH}x${SVG_HEIGHT})`);
