/**
 * The five slides of the Informa snapshot deck (`/informa/snapshot`) — the
 * forwardable, minimal-text companion to the full partnership deck. All
 * copy and numbers come from `@/lib/informa/snapshot-content` so facts
 * change in one place and never fork from the rate card.
 */
"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BarChart3,
  Gamepad2,
  ScanLine,
  Truck,
  type LucideIcon,
} from "lucide-react";

import type { DeckShellSlideProps } from "@/components/decks/DeckShell";
import { formatUsdWhole } from "@/lib/informa/kit-math";
import {
  pilotSnapshot,
  SNAPSHOT_AD_DEMO,
  SNAPSHOT_COLLAGE,
  SNAPSHOT_COVER,
  SNAPSHOT_PACKAGES,
  SNAPSHOT_PACKAGES_COPY,
  SNAPSHOT_VALUE,
  SNAPSHOT_WHAT,
} from "@/lib/informa/snapshot-content";
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

export function SnapshotCoverSlide({ onAdvance }: DeckShellSlideProps) {
  return (
    <div className="relative flex flex-1">
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/pitch/photos/adyen-play-queue.jpg"
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        >
          <source src="/pitch/video/adyen-event-loop.mp4" type="video/mp4" />
        </video>
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
            {SNAPSHOT_COVER.headlineLead}{" "}
            <span className="bg-gradient-to-r from-[var(--color-bb-cobalt)] to-[var(--color-bb-cyan)] bg-clip-text text-transparent">
              {SNAPSHOT_COVER.headlineAccent}
            </span>
          </motion.h1>

          <motion.p variants={rise} className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            {SNAPSHOT_COVER.sub}
          </motion.p>

          <motion.button
            variants={rise}
            type="button"
            onClick={onAdvance}
            className="mt-10 rounded-full bg-[var(--color-bb-cobalt)] px-8 py-3 text-sm font-semibold text-white transition-transform hover:scale-105"
          >
            {SNAPSHOT_COVER.cta}
          </motion.button>
        </motion.div>
      </SlideFrame>
    </div>
  );
}

const WHAT_ICONS: Record<string, LucideIcon> = {
  machines: Gamepad2,
  badge: ScanLine,
  report: BarChart3,
  delivery: Truck,
};

export function SnapshotWhatSlide({}: DeckShellSlideProps) {
  return (
    <SlideFrame>
      <p className="text-overline text-[var(--color-bb-cyan)]">{SNAPSHOT_WHAT.overline}</p>
      <h2 className="text-display-grotesk mt-2 max-w-3xl text-4xl sm:text-5xl">
        {SNAPSHOT_WHAT.headline}
      </h2>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="mt-12 grid gap-4 sm:grid-cols-2"
      >
        {SNAPSHOT_WHAT.points.map((point, i) => {
          const Icon = WHAT_ICONS[point.id] ?? Gamepad2;
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

export function SnapshotProofSlide({}: DeckShellSlideProps) {
  const [hero, ...rest] = SNAPSHOT_COLLAGE.photos;
  return (
    <SlideFrame className="max-w-6xl">
      <p className="text-overline text-[var(--color-bb-cyan)]">
        {SNAPSHOT_COLLAGE.overline}
      </p>
      <h2 className="text-display-grotesk mt-2 text-4xl sm:text-5xl">
        {SNAPSHOT_COLLAGE.headline}
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

export function SnapshotPackagesSlide({}: DeckShellSlideProps) {
  return (
    <SlideFrame className="max-w-6xl">
      <p className="text-overline text-[var(--color-bb-cyan)]">
        {SNAPSHOT_PACKAGES_COPY.overline}
      </p>
      <h2 className="text-display-grotesk mt-2 text-4xl sm:text-5xl">
        {SNAPSHOT_PACKAGES_COPY.headline}
      </h2>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
      >
        {SNAPSHOT_PACKAGES.map((pkg, i) => (
          <motion.div
            key={pkg.id}
            variants={rise}
            className="flex flex-col rounded-2xl border border-border/70 bg-card/50 p-5"
          >
            <MonoIndex index={i} />
            <h3 className="mt-1 font-semibold leading-snug">{pkg.name}</h3>
            <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground">
              {pkg.descriptor}
            </p>
            <p className="mt-4 text-2xl font-semibold tracking-tight text-[var(--color-bb-cyan)]">
              {pkg.bandCompact}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{pkg.bandUnit}</p>
          </motion.div>
        ))}
      </motion.div>

      <p className="mt-4 text-xs text-muted-foreground/70">
        {SNAPSHOT_PACKAGES_COPY.footnote}
      </p>

      {/* The Screen Ad Network, made concrete: where the 10-second slot
          actually runs on the machine. */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mt-5 flex flex-col gap-5 rounded-2xl border border-border/60 bg-card/40 p-5 sm:flex-row sm:items-center"
      >
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-bb-cyan)]">
            Screen Ad Network
          </p>
          <h3 className="mt-1 text-lg font-semibold">{SNAPSHOT_AD_DEMO.title}</h3>
          <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
            {SNAPSHOT_AD_DEMO.line}
          </p>
        </div>
        <div className="flex shrink-0 gap-4">
          {SNAPSHOT_AD_DEMO.machines.map((m) => (
            <figure key={m.src} className="w-24 sm:w-28">
              <div className={GLOW_FRAME}>
                <Image
                  src={m.src}
                  alt={m.alt}
                  width={670}
                  height={961}
                  className="h-auto w-full"
                />
              </div>
              <figcaption className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {m.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </motion.div>
    </SlideFrame>
  );
}

export function SnapshotValueSlide({}: DeckShellSlideProps) {
  const pilot = pilotSnapshot();
  const stats = [
    { label: "Shows", value: String(pilot.shows) },
    { label: "Machines on the floor", value: String(pilot.machines) },
    { label: "New sponsorship inventory", value: formatUsdWhole(pilot.gross) },
    { label: "Stays with Informa", value: formatUsdWhole(pilot.partnerShare) },
  ];

  return (
    <SlideFrame>
      <p className="text-overline text-[var(--color-bb-cyan)]">
        {SNAPSHOT_VALUE.overline}
      </p>
      <h2 className="text-display-grotesk mt-2 max-w-3xl text-4xl sm:text-5xl">
        {SNAPSHOT_VALUE.headline}
      </h2>
      <p className="mt-4 max-w-2xl text-muted-foreground">{SNAPSHOT_VALUE.sub}</p>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="mt-10 grid gap-3 sm:grid-cols-4"
      >
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={rise}
            className="rounded-2xl border border-border/70 bg-card/50 p-5"
          >
            <p className="text-2xl font-semibold tracking-tight text-[var(--color-bb-cyan)]">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>
      <p className="mt-3 text-xs text-muted-foreground/70">
        Worked example: the pilot mix. {SNAPSHOT_VALUE.footnote}
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        {SNAPSHOT_VALUE.links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/50 px-5 py-2.5 text-sm font-medium transition-colors hover:border-[var(--color-bb-cobalt)]/60 hover:text-[var(--color-bb-cyan)]"
          >
            {link.label}
            <ArrowUpRight className="size-3.5" aria-hidden />
          </Link>
        ))}
      </div>
    </SlideFrame>
  );
}
