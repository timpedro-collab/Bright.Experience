/**
 * Slide 9 of the confidential commercial plan: the gated 2027–2029 path from
 * commercial validation to channel-led scale.
 */
"use client";

import { motion } from "framer-motion";

import type { DeckShellSlideProps } from "@/components/decks/DeckShell";
import { COMMERCIAL_TIMELINE } from "@/lib/commercial-plan/content";
import {
  CommercialIndex,
  CommercialOverline,
  CommercialSlideFrame,
  commercialRise,
  commercialStagger,
} from "./commercial-slide-ui";

/** Slide 9: annual commercial phases, targets, and gates. */
export function CommercialTimelineSlide({}: DeckShellSlideProps) {
  return (
    <CommercialSlideFrame>
      <CommercialOverline>{COMMERCIAL_TIMELINE.overline}</CommercialOverline>
      <h2 className="text-display-grotesk mt-3 text-4xl sm:text-5xl">
        {COMMERCIAL_TIMELINE.headline}
      </h2>
      <motion.div
        variants={commercialStagger}
        initial="hidden"
        animate="visible"
        className="mt-14 grid gap-10 md:grid-cols-3"
      >
        {COMMERCIAL_TIMELINE.years.map((year, index) => (
          <motion.div
            key={year.year}
            variants={commercialRise}
            className="border-t-2 border-brand-cyan pt-5"
          >
            <div className="flex items-center justify-between">
              <CommercialIndex index={index} />
              <p className="text-2xl font-semibold text-brand-cyan">
                {year.year}
              </p>
            </div>
            <h3 className="mt-5 text-2xl font-semibold">{year.phase}</h3>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              {year.target}
            </p>
            <ol className="mt-7 space-y-4">
              {year.points.map((point, pointIndex) => (
                <li
                  key={point}
                  className="grid grid-cols-[1.5rem_1fr] gap-3 text-sm leading-relaxed text-muted-foreground"
                >
                  <span className="font-mono text-[10px] text-primary">
                    {String(pointIndex + 1).padStart(2, "0")}
                  </span>
                  {point}
                </li>
              ))}
            </ol>
          </motion.div>
        ))}
      </motion.div>
      <p className="mt-10 max-w-4xl border-t border-border/70 pt-5 text-sm text-muted-foreground">
        {COMMERCIAL_TIMELINE.footnote}
      </p>
    </CommercialSlideFrame>
  );
}
