/**
 * Sponsor deck slides 1 to 4: the templated hook, what the stand could be,
 * the play journey as sponsor outcomes, and picking a placement. Copy lives
 * in `@/lib/informa/sponsor-content`; show values arrive via ShowConfig.
 */
"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import { ProductFamily } from "@/components/informa/ProductFamily";
import { formatCount } from "@/lib/informa/kit-math";
import {
  SPONSOR_JOURNEY,
  STAND_VISION,
  type ShowConfig,
} from "@/lib/informa/sponsor-content";
import { cn } from "@/lib/utils";

export interface SponsorSlideProps {
  config: ShowConfig;
  onAdvance: () => void;
}

/** Shared slide scaffold, matching the organizer deck's rhythm. */
export function SlideFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 pb-24 pt-12 sm:px-10",
        className
      )}
    >
      {children}
    </section>
  );
}

export const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};
export const rise = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function SponsorHookSlide({ config, onAdvance }: SponsorSlideProps) {
  return (
    <div className="relative flex flex-1 overflow-hidden">
      {/* Theo's near-black hook: slow mesh blobs as atmosphere, not decoration */}
      <div aria-hidden className="absolute inset-0 bg-[hsl(233,56%,7%)]">
        <div className="mesh-drift-a absolute -left-1/4 top-[-20%] size-[60vw] rounded-full bg-primary/25 blur-[120px]" />
        <div className="mesh-drift-b absolute bottom-[-30%] right-[-15%] size-[55vw] rounded-full bg-brand-cyan/15 blur-[130px]" />
        <div className="mesh-drift-c absolute left-[30%] top-[40%] size-[35vw] rounded-full bg-primary/15 blur-[100px]" />
      </div>

      <SlideFrame className="relative items-center text-center">
        <motion.div variants={stagger} initial="hidden" animate="visible">
          <motion.div variants={rise} className="mb-8 flex justify-center">
            <Image
              src="/brand/bright-blue-wordmark-light.png"
              alt="Bright.Blue"
              width={168}
              height={45}
              priority
            />
          </motion.div>

          <motion.p variants={rise} className="text-overline text-brand-cyan">
            {config.show} · {config.dates}
          </motion.p>

          <motion.h1
            variants={rise}
            className="text-display-grotesk mx-auto mt-4 max-w-3xl text-balance text-5xl leading-tight sm:text-6xl"
          >
            {formatCount(config.attendees)}+ people will walk this floor.{" "}
            <span className="text-brand-gradient">
              Be the stand they remember.
            </span>
          </motion.h1>

          <motion.p variants={rise} className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            A fully branded interactive machine that stops traffic, samples
            your product, and hands you opted-in leads. Run for you, end to
            end, by Bright.Blue.
          </motion.p>

          <motion.button
            variants={rise}
            type="button"
            onClick={onAdvance}
            className="mt-10 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
          >
            See what your stand could be
          </motion.button>
        </motion.div>
      </SlideFrame>
    </div>
  );
}

export function StandVisionSlide({ config }: SponsorSlideProps) {
  return (
    <SlideFrame>
      <p className="text-overline text-brand-cyan">The idea</p>
      <h2 className="text-display-grotesk mt-2 max-w-3xl text-4xl sm:text-5xl">
        What your presence at {config.show} could be
      </h2>

      <div className="mt-10 grid gap-6 lg:grid-cols-[3fr_2fr]">
        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-4">
          {STAND_VISION.map((item) => (
            <motion.div
              key={item.label}
              variants={rise}
              className="rounded-2xl border border-border/70 bg-card/50 p-6"
            >
              <h3 className="font-semibold text-brand-cyan">{item.label}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{item.line}</p>
            </motion.div>
          ))}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="relative min-h-72 overflow-hidden rounded-2xl border border-border/70"
        >
          <Image
            src="/pitch/photos/pepsi-tap-play.jpg"
            alt="Attendee mid-play on a fully wrapped sponsor machine at a live event"
            fill
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="object-cover"
          />
        </motion.div>
      </div>
    </SlideFrame>
  );
}

export function SponsorJourneySlide({}: SponsorSlideProps) {
  return (
    <SlideFrame>
      <p className="text-overline text-brand-cyan">The format</p>
      <h2 className="text-display-grotesk mt-2 max-w-2xl text-4xl sm:text-5xl">
        What one play does for your brand
      </h2>

      <motion.ol
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="mt-10 grid gap-3 sm:grid-cols-5"
      >
        {SPONSOR_JOURNEY.map((s, i) => (
          <motion.li
            key={s.step}
            variants={rise}
            className="rounded-2xl border border-border/70 bg-card/50 p-5"
          >
            <span className="text-xs font-semibold text-primary">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-1 font-semibold">{s.step}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.line}</p>
          </motion.li>
        ))}
      </motion.ol>

      <p className="mt-6 text-xs text-muted-foreground/70">
        Illustrative journey. Your proposal quotes benchmarked ranges with
        their sample size.
      </p>
    </SlideFrame>
  );
}

export function SponsorPlacementSlide({}: SponsorSlideProps) {
  return (
    <SlideFrame>
      <p className="text-overline text-brand-cyan">The menu</p>
      <h2 className="text-display-grotesk mt-2 max-w-2xl text-4xl sm:text-5xl">
        Pick your placement
      </h2>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Three ways to run Bright.Blue at the show. Your Informa rep prices
        the one that fits and locks the position on the floor plan.
      </p>

      <div className="mt-8">
        <ProductFamily variant="sponsor" />
      </div>
    </SlideFrame>
  );
}
