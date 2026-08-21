/**
 * The five slides of the venue snapshot deck (`/venue`), pitched at
 * convention centers and expo venues. All copy comes from
 * `@/lib/venue-pitch/content`; the posture is non-financial by design.
 */
"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  CalendarClock,
  HandCoins,
  Plug,
  Ruler,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Trophy,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type { DeckShellSlideProps } from "@/components/decks/DeckShell";
import {
  VENUE_BENEFITS,
  VENUE_COLLAGE,
  VENUE_COVER,
  VENUE_NEEDS,
  VENUE_WHAT,
} from "@/lib/venue-pitch/content";
import { cn } from "@/lib/utils";
import { GLOW_FRAME, MonoIndex } from "@/components/decks/deck-accents";

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

export function VenueCoverSlide({ onAdvance }: DeckShellSlideProps) {
  return (
    <div className="relative flex flex-1">
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/pitch/photos/biba-leadenhall.jpg"
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        >
          <source src="/pitch/video/adyen-event-loop.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
      </div>

      <SlideFrame className="relative items-center text-center">
        <motion.div variants={stagger} initial="hidden" animate="visible">
          <motion.div variants={rise} className="mb-8 flex items-center justify-center">
            <Image
              src="/brand/bright-blue-wordmark-light.png"
              alt="Bright.Blue"
              width={168}
              height={45}
              priority
            />
          </motion.div>

          <motion.h1
            variants={rise}
            className="text-display-grotesk mx-auto max-w-3xl text-balance text-5xl leading-tight sm:text-6xl"
          >
            {VENUE_COVER.headlineLead}{" "}
            <span className="bg-gradient-to-r from-[var(--color-bb-cobalt)] to-[var(--color-bb-cyan)] bg-clip-text text-transparent">
              {VENUE_COVER.headlineAccent}
            </span>
          </motion.h1>

          <motion.p variants={rise} className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            {VENUE_COVER.sub}
          </motion.p>

          <motion.button
            variants={rise}
            type="button"
            onClick={onAdvance}
            className="mt-10 rounded-full bg-[var(--color-bb-cobalt)] px-8 py-3 text-sm font-semibold text-white transition-transform hover:scale-105"
          >
            {VENUE_COVER.cta}
          </motion.button>
        </motion.div>
      </SlideFrame>
    </div>
  );
}

const WHAT_ICONS: Record<string, LucideIcon> = {
  turnkey: Wrench,
  funded: HandCoins,
  badge: ScanLine,
  zerocost: ShieldCheck,
};

export function VenueWhatSlide({}: DeckShellSlideProps) {
  return (
    <SlideFrame>
      <p className="text-overline text-[var(--color-bb-cyan)]">{VENUE_WHAT.overline}</p>
      <h2 className="text-display-grotesk mt-2 max-w-3xl text-4xl sm:text-5xl">
        {VENUE_WHAT.headline}
      </h2>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="mt-12 grid gap-4 sm:grid-cols-2"
      >
        {VENUE_WHAT.points.map((point, i) => {
          const Icon = WHAT_ICONS[point.id] ?? Wrench;
          return (
            <motion.div
              key={point.id}
              variants={rise}
              className="flex items-start gap-4 rounded-2xl border border-border/70 bg-card/50 p-6"
            >
              <span className="rounded-xl bg-[var(--color-bb-cobalt)]/15 p-3">
                <Icon className="size-6 text-[var(--color-bb-cyan)]" aria-hidden />
              </span>
              <span>
                <MonoIndex index={i} />
                <h3 className="mt-0.5 text-lg font-semibold">{point.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {point.line}
                </p>
              </span>
            </motion.div>
          );
        })}
      </motion.div>
    </SlideFrame>
  );
}

export function VenueProofSlide({}: DeckShellSlideProps) {
  const [hero, ...rest] = VENUE_COLLAGE.photos;
  return (
    <SlideFrame className="max-w-6xl">
      <p className="text-overline text-[var(--color-bb-cyan)]">
        {VENUE_COLLAGE.overline}
      </p>
      <h2 className="text-display-grotesk mt-2 text-4xl sm:text-5xl">
        {VENUE_COLLAGE.headline}
      </h2>

      {/* Balanced 3-column mosaic: hero 2x2 left, two stacked right, three
          across the bottom — six photos, no orphans. */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="mt-8 grid auto-rows-[7rem] grid-cols-2 gap-3 sm:auto-rows-[10rem] sm:grid-cols-3"
      >
        <motion.figure
          variants={rise}
          className="relative col-span-2 row-span-2 overflow-hidden rounded-2xl border border-border/60"
        >
          <Image
            src={hero.src}
            alt={hero.alt}
            fill
            sizes="(max-width: 640px) 100vw, 66vw"
            className="object-cover"
            priority
          />
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8 text-xs font-medium text-white">
            {hero.caption}
          </figcaption>
        </motion.figure>

        {rest.map((photo) => (
          <motion.figure
            key={photo.src}
            variants={rise}
            className="relative overflow-hidden rounded-2xl border border-border/60"
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              className="object-cover"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6 text-[11px] font-medium text-white">
              {photo.caption}
            </figcaption>
          </motion.figure>
        ))}
      </motion.div>
    </SlideFrame>
  );
}

const NEEDS_ICONS: Record<string, LucideIcon> = {
  space: Ruler,
  power: Plug,
  schedule: CalendarClock,
  cost: BadgeCheck,
};

export function VenueNeedsSlide({}: DeckShellSlideProps) {
  return (
    <SlideFrame>
      <p className="text-overline text-[var(--color-bb-cyan)]">{VENUE_NEEDS.overline}</p>
      <h2 className="text-display-grotesk mt-2 max-w-3xl text-4xl sm:text-5xl">
        {VENUE_NEEDS.headline}
      </h2>

      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_auto]">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:grid-cols-2"
        >
          {VENUE_NEEDS.specs.map((spec, i) => {
            const Icon = NEEDS_ICONS[spec.id] ?? Ruler;
            return (
              <motion.div
                key={spec.id}
                variants={rise}
                className="rounded-2xl border border-border/70 bg-card/50 p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex rounded-xl bg-[var(--color-bb-cobalt)]/15 p-3">
                    <Icon className="size-6 text-[var(--color-bb-cyan)]" aria-hidden />
                  </span>
                  <MonoIndex index={i} />
                </div>
                <h3 className="mt-4 font-semibold">{spec.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {spec.line}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* The machine itself, so "one square meter" has a face — its
            idle-screen ad state doubles as the building's sellable
            screen inventory (picked up on the benefits slide). */}
        <motion.figure
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-48 sm:w-56 lg:mx-0"
        >
          <div className={GLOW_FRAME}>
            <Image
              src={VENUE_NEEDS.machine.src}
              alt={VENUE_NEEDS.machine.alt}
              width={670}
              height={961}
              className="h-auto w-full"
            />
          </div>
          <figcaption className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
            {VENUE_NEEDS.machine.caption}
          </figcaption>
        </motion.figure>
      </div>

      <p className="mt-6 text-xs text-muted-foreground/70">{VENUE_NEEDS.footnote}</p>
    </SlideFrame>
  );
}

const BENEFIT_ICONS: Record<string, LucideIcon> = {
  differentiator: Trophy,
  energy: Zap,
  experience: Sparkles,
  proof: BarChart3,
};

export function VenueBenefitsSlide({}: DeckShellSlideProps) {
  return (
    <SlideFrame>
      <p className="text-overline text-[var(--color-bb-cyan)]">
        {VENUE_BENEFITS.overline}
      </p>
      <h2 className="text-display-grotesk mt-2 max-w-3xl text-4xl sm:text-5xl">
        {VENUE_BENEFITS.headline}
      </h2>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="mt-10 grid gap-4 sm:grid-cols-2"
      >
        {VENUE_BENEFITS.points.map((point, i) => {
          const Icon = BENEFIT_ICONS[point.id] ?? Trophy;
          return (
            <motion.div
              key={point.id}
              variants={rise}
              className="flex items-start gap-4 rounded-2xl border border-border/70 bg-card/50 p-6"
            >
              <span className="rounded-xl bg-[var(--color-bb-cobalt)]/15 p-3">
                <Icon className="size-6 text-[var(--color-bb-cyan)]" aria-hidden />
              </span>
              <span>
                <MonoIndex index={i} />
                <h3 className="mt-0.5 text-lg font-semibold">{point.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {point.line}
                </p>
              </span>
            </motion.div>
          );
        })}
      </motion.div>

      <p className="mt-6 max-w-2xl text-sm text-muted-foreground">
        {VENUE_BENEFITS.economicsNote}
      </p>

      <div className="mt-8">
        <a
          href={VENUE_BENEFITS.contact.href}
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-bb-cobalt)] px-7 py-3 text-sm font-semibold text-white transition-transform hover:scale-105"
        >
          {VENUE_BENEFITS.contact.label}
          <ArrowUpRight className="size-4" aria-hidden />
        </a>
      </div>
    </SlideFrame>
  );
}
