/** Confetti celebration utility — fires brand-coloured bursts on positive moments */
"use client";

import confetti from "canvas-confetti";

const BRAND_COLORS = [
  "hsl(230, 93%, 53%)", // Bright blue
  "hsl(189, 100%, 75%)", // Electric cyan
  "hsl(0, 0%, 100%)", // White
  "hsl(143, 72%, 42%)", // Success green
];

const Z = 10010;

/** Default celebration — gentle burst from the centre */
export function celebrate(): void {
  if (typeof window === "undefined") return;
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: BRAND_COLORS,
    scalar: 0.9,
    ticks: 200,
    zIndex: Z,
  });
}

/** Larger celebration — used for major milestones like quote acceptance */
export function celebrateBig(): void {
  if (typeof window === "undefined") return;
  const duration = 1.4 * 1000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: BRAND_COLORS,
      zIndex: Z,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: BRAND_COLORS,
      zIndex: Z,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

/** Subtle confetti from a specific element — used near "approve" or "complete" buttons */
export function celebrateFromElement(el: HTMLElement | null): void {
  if (typeof window === "undefined" || !el) {
    celebrate();
    return;
  }
  const rect = el.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;
  confetti({
    particleCount: 60,
    spread: 60,
    origin: { x, y },
    colors: BRAND_COLORS,
    scalar: 0.85,
    ticks: 150,
    zIndex: Z,
  });
}
