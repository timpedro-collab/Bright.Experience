/**
 * Slides 1 to 4 of the Informa pitch: cover, the Tampa showcase, what one
 * play creates, and the gap in organizer inventory. All copy comes from
 * `@/lib/informa/content` so facts change in one place.
 */
"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ScanLine } from "lucide-react";

import {
  BADGE_CLAIM,
  GAP_CLAIMS,
  PLAY_JOURNEY,
  TAMPA_PLACEMENTS,
  TAMPA_SHOW,
} from "@/lib/informa/content";
import { cn } from "@/lib/utils";

export interface SlideProps {
  onAdvance: () => void;
}

/** Shared slide scaffold: centered column with breathing room for the chrome. */
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
        "mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 pb-24 pt-12 sm:px-10",
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

export function CoverSlide({ onAdvance }: SlideProps) {
  return (
    <div className="relative flex flex-1">
      {/* Real activation photography, dimmed to a backdrop */}
      <div aria-hidden className="absolute inset-0">
        <Image
          src="/pitch/photos/red-bull-gym.jpg"
          alt=""
          fill
          priority
          className="object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
      </div>

      <SlideFrame className="relative items-center text-center">
        <motion.div variants={stagger} initial="hidden" animate="visible">
          <motion.div variants={rise} className="mb-8 flex items-center justify-center gap-4">
            <Image
              src="/brand/bright-blue-wordmark-light.png"
              alt="Bright.Blue"
              width={168}
              height={45}
              priority
            />
            <span className="text-2xl font-light text-muted-foreground">×</span>
            <span className="text-2xl font-semibold tracking-tight">Informa</span>
          </motion.div>

          <motion.h1
            variants={rise}
            className="text-display-grotesk mx-auto max-w-3xl text-balance text-5xl leading-tight sm:text-6xl"
          >
            New inventory for the shows{" "}
            <span className="bg-gradient-to-r from-[var(--color-bb-cobalt)] to-[var(--color-bb-cyan)] bg-clip-text text-transparent">
              you already run.
            </span>
          </motion.h1>

          <motion.p variants={rise} className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Crowd-stopping activations, measured to the play. Starting on your
            own show floor in Tampa.
          </motion.p>

          <motion.button
            variants={rise}
            type="button"
            onClick={onAdvance}
            className="mt-10 rounded-full bg-[var(--color-bb-cobalt)] px-8 py-3 text-sm font-semibold text-white transition-transform hover:scale-105"
          >
            Start with Tampa
          </motion.button>
        </motion.div>
      </SlideFrame>
    </div>
  );
}

export function TampaSlide({}: SlideProps) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <SlideFrame>
      <p className="text-overline text-[var(--color-bb-cyan)]">Act one</p>
      <h2 className="text-display-grotesk mt-2 text-4xl sm:text-5xl">
        {TAMPA_SHOW.name}
      </h2>
      <p className="mt-2 text-muted-foreground">
        {TAMPA_SHOW.dates} · {TAMPA_SHOW.venue} · {TAMPA_SHOW.audience}
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {TAMPA_PLACEMENTS.map((p, i) => {
          const isOpen = open === p.id;
          return (
            <motion.button
              key={p.id}
              type="button"
              onClick={() => setOpen(isOpen ? null : p.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.1, duration: 0.5 }}
              aria-expanded={isOpen}
              className={cn(
                "rounded-2xl border p-6 text-left transition-colors",
                isOpen
                  ? "border-[var(--color-bb-cobalt)] bg-[var(--color-bb-cobalt)]/10"
                  : "border-border/70 bg-card/50 hover:border-[var(--color-bb-cobalt)]/50"
              )}
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Machine {i + 1} · {p.location}
              </p>
              <h3 className="mt-2 text-xl font-semibold">{p.job}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {isOpen ? p.detail : "Tap to open"}
              </p>
              {isOpen && (
                <p className="mt-3 text-sm font-medium text-[var(--color-bb-cyan)]">
                  {p.beneficiary}
                </p>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-8 flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-5 py-4">
        <ScanLine className="size-5 shrink-0 text-[var(--color-bb-cyan)]" aria-hidden />
        <p className="text-sm text-muted-foreground">{BADGE_CLAIM}</p>
      </div>
    </SlideFrame>
  );
}

export function JourneySlide({}: SlideProps) {
  return (
    <SlideFrame>
      <p className="text-overline text-[var(--color-bb-cyan)]">The format</p>
      <h2 className="text-display-grotesk mt-2 max-w-2xl text-4xl sm:text-5xl">
        What one play creates
      </h2>

      <motion.ol
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="mt-10 grid gap-3 sm:grid-cols-5"
      >
        {PLAY_JOURNEY.map((s, i) => (
          <motion.li
            key={s.step}
            variants={rise}
            className="rounded-2xl border border-border/70 bg-card/50 p-5"
          >
            <span className="text-xs font-semibold text-[var(--color-bb-cobalt)]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-1 font-semibold">{s.step}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.line}</p>
          </motion.li>
        ))}
      </motion.ol>

      <p className="mt-6 text-xs text-muted-foreground/70">
        Illustrative journey. Every claim in a live proposal ships as a
        benchmarked range with its sample size.
      </p>
    </SlideFrame>
  );
}

export function GapSlide({}: SlideProps) {
  return (
    <SlideFrame>
      <p className="text-overline text-[var(--color-bb-cyan)]">The gap</p>
      <h2 className="text-display-grotesk mt-2 max-w-3xl text-4xl sm:text-5xl">
        Nobody sells this. Including you.
      </h2>

      <motion.div variants={stagger} initial="hidden" animate="visible" className="mt-10 space-y-4">
        {GAP_CLAIMS.map((g) => (
          <motion.div
            key={g.claim}
            variants={rise}
            className="rounded-2xl border border-border/70 bg-card/50 p-6"
          >
            <p className="text-lg font-semibold leading-snug sm:text-xl">{g.claim}</p>
            <p className="mt-2 text-sm text-muted-foreground">{g.support}</p>
          </motion.div>
        ))}
      </motion.div>
    </SlideFrame>
  );
}
