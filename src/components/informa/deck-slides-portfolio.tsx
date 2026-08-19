/**
 * Portfolio map slide for the Informa pitch: the whole show calendar on one
 * dotted world map, with Tampa highlighted as the pilot. Show data lives in
 * `@/lib/informa/portfolio-shows`; the base map is a committed SVG generated
 * by `scripts/generate-world-dots.mjs` with the same projection.
 */
"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import {
  PORTFOLIO_CITIES,
  projectToMapPercent,
} from "@/lib/informa/portfolio-shows";
import type { SlideProps } from "./deck-slides-story";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.3 } },
};
const pop = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
  },
};
const rise = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const PROGRAM_CHIPS = [
  "One agreement, portfolio-wide",
  "Five products, identical at every show",
  "One report format sponsors learn once",
];

export function PortfolioSlide({}: SlideProps) {
  // Paint order: faint reach dots first, then targets, then the pilot so
  // its label sits above every neighbour.
  const cities = [
    ...PORTFOLIO_CITIES.filter((c) => c.reach),
    ...PORTFOLIO_CITIES.filter((c) => !c.reach && !c.pilot),
    ...PORTFOLIO_CITIES.filter((c) => c.pilot),
  ];
  const targets = PORTFOLIO_CITIES.filter((c) => !c.pilot && !c.reach);

  return (
    <section className="mx-auto grid w-full max-w-6xl flex-1 content-center items-center gap-10 px-6 pb-24 pt-12 sm:px-10 lg:grid-cols-[2fr_3fr]">
      <div>
        <p className="text-overline text-[var(--color-bb-cyan)]">The portfolio</p>
        <h2 className="text-display-grotesk mt-2 text-4xl sm:text-5xl">
          One program, your whole calendar
        </h2>
        <p className="mt-3 text-lg text-muted-foreground">
          The rails get built once, then travel. Tampa is where the program
          starts; the bright markers are the US and UK rooms it&rsquo;s aimed
          at next. The faint dots are the rest of your portfolio — the same
          rails reach every one of them.
        </p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="mt-7 space-y-2.5"
        >
          {PROGRAM_CHIPS.map((chip) => (
            <div
              key={chip}
              className="rounded-xl border border-[var(--color-bb-cobalt)]/40 bg-[var(--color-bb-cobalt)]/5 px-4 py-2.5 text-sm font-medium"
            >
              {chip}
            </div>
          ))}
        </motion.div>
      </div>

      <div>
        {/* The wrapper's size comes from the intrinsic image, so percentage-
            positioned markers stay glued to their coordinates at any width. */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="relative w-full"
        >
          <Image
            src="/pitch/map/world-dots.svg"
            alt="Dotted world map of Informa flagship show cities"
            width={1000}
            height={375}
            className="h-auto w-full"
            priority
          />
          {cities.map((city) => {
            const { leftPct, topPct } = projectToMapPercent(city.lat, city.lng);
            return (
              <motion.span
                key={city.key}
                variants={pop}
                className="absolute"
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {city.pilot ? (
                  <span className="relative block">
                    <motion.span
                      aria-hidden
                      className="absolute left-1/2 top-1/2 block size-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-bb-cyan)]/30"
                      animate={{ scale: [1, 1.9], opacity: [0.7, 0] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                    />
                    <span className="relative block size-3.5 rounded-full border-2 border-background bg-[var(--color-bb-cyan)]" />
                    <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full border border-[var(--color-bb-cyan)]/50 bg-background/85 px-3 py-1 text-xs font-semibold text-[var(--color-bb-cyan)] backdrop-blur">
                      Tampa · Connect Marketplace — starts here
                    </span>
                  </span>
                ) : city.reach ? (
                  <span className="block size-1.5 rounded-full bg-[var(--color-bb-cobalt-soft)]/35" />
                ) : (
                  <span className="block size-2.5 rounded-full border border-background/80 bg-[var(--color-bb-cobalt-soft)]" />
                )}
              </motion.span>
            );
          })}
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="mt-5 flex flex-wrap gap-1.5"
        >
          {targets.map((city) => (
            <motion.span
              key={city.key}
              variants={rise}
              className="rounded-full border border-border/70 bg-card/50 px-2.5 py-1 text-[11px] text-muted-foreground"
            >
              <span className="font-semibold text-foreground">{city.city}</span>
              {" · "}
              {city.shows.join(", ")}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
