/**
 * Roadmap slide for the Informa pitch: what's live today beside what's in
 * build for 2027. Copy (and the sales psychology behind its structure)
 * lives in `ROADMAP_2027` in `@/lib/informa/content`.
 */
"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

import { ROADMAP_2027 } from "@/lib/informa/content";
import type { SlideProps } from "./deck-slides-story";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.25 } },
};
const rise = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function RoadmapSlide({}: SlideProps) {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pb-24 pt-12 sm:px-10">
      <p className="text-overline text-brand-cyan">
        {ROADMAP_2027.overline}
      </p>
      <h2 className="text-display-grotesk mt-2 max-w-3xl text-4xl sm:text-5xl">
        {ROADMAP_2027.headline}
      </h2>
      <p className="mt-3 max-w-3xl text-lg text-muted-foreground">
        {ROADMAP_2027.intro}
      </p>

      <div className="mt-8 grid gap-4 lg:grid-cols-[2fr_3fr]">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="rounded-2xl border border-border/70 bg-card/50 p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {ROADMAP_2027.liveNow.title}
          </p>
          <ul className="mt-4 space-y-3">
            {ROADMAP_2027.liveNow.items.map((item) => (
              <motion.li
                key={item}
                variants={rise}
                className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground"
              >
                <Check
                  className="mt-0.5 size-4 shrink-0 text-brand-cyan"
                  aria-hidden
                />
                {item}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="grid gap-3"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-cyan">
            {ROADMAP_2027.inBuild.title}
          </p>
          {ROADMAP_2027.inBuild.items.map((item) => (
            <motion.div
              key={item.title}
              variants={rise}
              className="rounded-2xl border border-primary/40 bg-primary/5 p-5"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-semibold">{item.title}</p>
                <span className="shrink-0 rounded-full border border-brand-cyan/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-brand-cyan">
                  2027
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {item.detail}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground"
      >
        {ROADMAP_2027.closer}
      </motion.p>
    </section>
  );
}
