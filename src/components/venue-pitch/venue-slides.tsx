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
        "mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 pb-24 pt-10 sm:px-12 lg:px-16",
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

      <SlideFrame className="relative">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="max-w-3xl"
        >
          <motion.div variants={rise} className="mb-12 flex items-center">
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
            className="text-display-grotesk max-w-3xl text-balance text-5xl leading-[0.98] sm:text-7xl"
          >
            {VENUE_COVER.headlineLead}{" "}
            <span className="bg-gradient-to-r from-[var(--color-bb-cobalt)] to-[var(--color-bb-cyan)] bg-clip-text text-transparent">
              {VENUE_COVER.headlineAccent}
            </span>
          </motion.h1>

          <motion.p variants={rise} className="mt-7 max-w-xl text-lg text-muted-foreground">
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
        className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
      >
        {VENUE_WHAT.points.map((point, i) => {
          const Icon = WHAT_ICONS[point.id] ?? Wrench;
          return (
            <motion.div
              key={point.id}
              variants={rise}
              className="border-t-2 border-[var(--color-bb-cyan)] pt-5"
            >
              <div className="flex items-center justify-between">
                <MonoIndex index={i} />
                <Icon className="size-5 text-[var(--color-bb-cyan)]" aria-hidden />
              </div>
              <h3 className="mt-4 text-xl font-semibold leading-tight">{point.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {point.line}
              </p>
            </motion.div>
          );
        })}
      </motion.div>
    </SlideFrame>
  );
}

export function VenueProofSlide({}: DeckShellSlideProps) {
  const photos = VENUE_COLLAGE.photos.slice(0, 4);
  return (
    <SlideFrame>
      <p className="text-overline text-[var(--color-bb-cyan)]">
        {VENUE_COLLAGE.overline}
      </p>
      <h2 className="text-display-grotesk mt-2 text-4xl sm:text-5xl">
        {VENUE_COLLAGE.headline}
      </h2>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {photos.map((photo, i) => (
          <motion.figure
            key={photo.src}
            variants={rise}
            className="min-w-0"
          >
            <div className={cn(GLOW_FRAME, "relative aspect-[4/5]")}>
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover"
                priority={i === 0}
              />
            </div>
            <figcaption className="mt-4">
              <MonoIndex index={i} />
              <p className="mt-1 text-sm font-semibold text-foreground">{photo.caption}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Live floor. Live audience.
              </p>
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

      <div className="mt-10 grid items-center gap-12 lg:grid-cols-[1fr_20rem]">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="grid gap-x-8 gap-y-10 sm:grid-cols-2"
        >
          {VENUE_NEEDS.specs.map((spec, i) => {
            const Icon = NEEDS_ICONS[spec.id] ?? Ruler;
            return (
              <motion.div
                key={spec.id}
                variants={rise}
                className="border-t-2 border-[var(--color-bb-cyan)] pt-4"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex rounded-xl bg-[var(--color-bb-cobalt)]/15 p-3">
                    <Icon className="size-6 text-[var(--color-bb-cyan)]" aria-hidden />
                  </span>
                  <MonoIndex index={i} />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{spec.title}</h3>
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
          className="mx-auto w-64 sm:w-72 lg:mx-0"
        >
          <div>
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
        className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
      >
        {VENUE_BENEFITS.points.map((point, i) => {
          const Icon = BENEFIT_ICONS[point.id] ?? Trophy;
          return (
            <motion.div
              key={point.id}
              variants={rise}
              className="border-t-2 border-[var(--color-bb-cyan)] pt-5"
            >
              <div className="flex items-center justify-between">
                <MonoIndex index={i} />
                <Icon className="size-5 text-[var(--color-bb-cyan)]" aria-hidden />
              </div>
              <h3 className="mt-4 text-xl font-semibold leading-tight">{point.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {point.line}
              </p>
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
