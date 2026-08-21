/**
 * The two-model decision slide: resell as sponsor inventory, run as an
 * Informa-branded layer, or both. Tampa demonstrates both formats as a
 * working pilot without implying either commercial model was transacted.
 * Carries the portfolio-portability strip and compliant data posture line.
 */
"use client";

import { motion } from "framer-motion";

import { PORTABILITY, TWO_MODELS } from "@/lib/informa/content";
import type { SlideProps } from "./deck-slides-story";
import { cn } from "@/lib/utils";

function SlideFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 pb-20 pt-10 sm:px-10",
        className
      )}
    >
      {children}
    </section>
  );
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};
const rise = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function TwoModelsSlide({}: SlideProps) {
  return (
    <SlideFrame>
      <p className="text-overline text-[var(--color-bb-cyan)]">The decision</p>
      <h2 className="text-display-grotesk mt-2 max-w-3xl text-4xl sm:text-5xl">
        {TWO_MODELS.headline}
      </h2>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="mt-8 grid gap-4 sm:grid-cols-2"
      >
        {TWO_MODELS.models.map((model) => (
          <motion.div
            key={model.name}
            variants={rise}
            className="rounded-2xl border border-border/70 bg-card/50 p-6"
          >
            <h3 className="text-display-grotesk text-2xl">{model.name}</h3>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-widest text-[var(--color-bb-cyan)]">
              {model.descriptor}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {model.detail}
            </p>
            <p className="mt-3 text-sm font-medium text-[var(--color-bb-cyan)]">
              {model.tampa}
            </p>
          </motion.div>
        ))}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-5 max-w-5xl text-sm leading-relaxed text-muted-foreground"
      >
        {TWO_MODELS.note} {TWO_MODELS.dataPosture}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5 }}
        className="mt-8"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {PORTABILITY.headline}
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {PORTABILITY.formats.map((f) => (
            <div
              key={f.format}
              className="rounded-xl border border-[var(--color-bb-cobalt)]/40 bg-[var(--color-bb-cobalt)]/5 px-4 py-3"
            >
              <p className="text-sm font-semibold">{f.format}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{f.line}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </SlideFrame>
  );
}
