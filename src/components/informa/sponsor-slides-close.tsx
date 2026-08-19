/**
 * Sponsor deck slides 5 to 8: the show-preloaded numbers, proof (gallery
 * and client marquee), the report the sponsor receives, and the close.
 */
"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Download } from "lucide-react";

import { PlacementConfigurator } from "@/components/informa/PlacementConfigurator";
import { SAMPLE_REPORT_PDF } from "@/components/informa/SampleReportView";
import {
  rise,
  SlideFrame,
  stagger,
  type SponsorSlideProps,
} from "@/components/informa/sponsor-slides-story";
import { KIT_GALLERY } from "@/lib/informa/content";
import { formatCount, formatUsdWhole } from "@/lib/informa/kit-math";
import {
  reportCpl,
  reportTotals,
  SAMPLE_REPORT,
} from "@/lib/informa/sample-report";
import {
  REPORT_PROMISE,
  SPONSOR_CLOSE,
} from "@/lib/informa/sponsor-content";
import { CLIENT_LOGOS } from "@/lib/marketing/client-logos";
import { cn } from "@/lib/utils";

export function SponsorNumbersSlide({ config }: SponsorSlideProps) {
  return (
    <SlideFrame>
      <p className="text-overline text-[var(--color-bb-cyan)]">Your numbers</p>
      <h2 className="text-display-grotesk mt-2 max-w-3xl text-4xl sm:text-5xl">
        What a placement at {config.show} creates
      </h2>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Preloaded with this show&apos;s size and run. Move the levers and
        watch the value respond.
      </p>

      <div className="mt-8">
        {/* Remount when the show setup changes so the levers re-seed. */}
        <PlacementConfigurator
          key={`${config.attendees}-${config.days}`}
          initialAttendees={config.attendees}
          initialDays={config.days}
        />
      </div>
    </SlideFrame>
  );
}

export function SponsorProofSlide({}: SponsorSlideProps) {
  return (
    <SlideFrame>
      <p className="text-overline text-[var(--color-bb-cyan)]">Proof</p>
      <h2 className="text-display-grotesk mt-2 max-w-2xl text-4xl sm:text-5xl">
        On show floors already
      </h2>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {KIT_GALLERY.map((photo) => (
          <motion.div
            key={photo.src}
            variants={rise}
            className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-border/70"
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(max-width: 1024px) 50vw, 25vw"
              className="object-cover"
              style={{ objectPosition: photo.position }}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Client marquee: the same seamless loop as the marketing wall. */}
      <div className="bb-logo-marquee-group relative mt-8 overflow-hidden rounded-2xl border border-white/[0.06] bg-[hsl(233,47%,8%)] py-6 motion-reduce:overflow-visible">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[hsl(233,47%,8%)] to-transparent motion-reduce:hidden"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[hsl(233,47%,8%)] to-transparent motion-reduce:hidden"
        />
        <div className="bb-logo-marquee flex w-max motion-reduce:w-full">
          {[false, true].map((dup) => (
            <ul
              key={dup ? "dup" : "main"}
              role="list"
              aria-hidden={dup || undefined}
              className={cn(
                "flex shrink-0 items-center gap-x-12 pr-12",
                dup
                  ? "motion-reduce:hidden"
                  : "motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-4 motion-reduce:pr-0"
              )}
            >
              {CLIENT_LOGOS.map((logo) => (
                <li
                  key={`${logo.name}${dup ? "-dup" : ""}`}
                  className="flex h-9 shrink-0 items-center"
                  title={logo.name}
                >
                  {logo.src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logo.src}
                      alt={dup ? "" : logo.name}
                      className="h-6 w-auto max-w-[7.5rem] object-contain opacity-70 brightness-0 invert"
                    />
                  ) : (
                    <span className="text-sm font-bold uppercase tracking-tight text-white/70">
                      {logo.name}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </SlideFrame>
  );
}

export function SponsorReportSlide({}: SponsorSlideProps) {
  const totals = reportTotals(SAMPLE_REPORT.byDay);
  const cpl = reportCpl(SAMPLE_REPORT.meta.priceUsd, totals.leads);

  return (
    <SlideFrame>
      <p className="text-overline text-[var(--color-bb-cyan)]">After the show</p>
      <h2 className="text-display-grotesk mt-2 max-w-3xl text-4xl sm:text-5xl">
        The report that survives your internal meeting
      </h2>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
          {REPORT_PROMISE.map((line) => (
            <motion.p
              key={line}
              variants={rise}
              className="rounded-xl border border-border/70 bg-card/50 px-5 py-4 text-sm leading-relaxed text-muted-foreground"
            >
              {line}
            </motion.p>
          ))}
          <motion.p variants={rise} className="pt-1 text-xs text-muted-foreground/70">
            Delivered within 24 hours of show close, every placement, every time.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="rounded-2xl border border-[var(--color-bb-cobalt)]/50 bg-[var(--color-bb-cobalt)]/10 p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            From the sample report
          </p>
          <dl className="mt-4 grid grid-cols-3 gap-4">
            <div>
              <dt className="text-xs text-muted-foreground">Plays</dt>
              <dd className="text-2xl font-semibold tabular-nums">{formatCount(totals.plays)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Opted-in leads</dt>
              <dd className="text-2xl font-semibold tabular-nums">{formatCount(totals.leads)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Cost per lead</dt>
              <dd className="text-2xl font-semibold tabular-nums">
                {cpl == null ? "n/a" : formatUsdWhole(cpl)}
              </dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/informa/report"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-bb-cobalt)] px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-105"
            >
              Open the full sample report
              <ArrowUpRight className="size-4" aria-hidden />
            </Link>
            <a
              href={SAMPLE_REPORT_PDF}
              download
              className="inline-flex items-center gap-2 rounded-lg border border-border/70 px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--color-bb-cyan)] hover:text-[var(--color-bb-cyan)]"
            >
              <Download className="size-4" aria-hidden />
              PDF
            </a>
          </div>
        </motion.div>
      </div>
    </SlideFrame>
  );
}

export function SponsorCloseSlide({ config }: SponsorSlideProps) {
  return (
    <SlideFrame>
      <p className="text-overline text-[var(--color-bb-cyan)]">Lock it in</p>
      <h2 className="text-display-grotesk mt-2 max-w-3xl text-4xl sm:text-5xl">
        Three steps to the floor at {config.show}
      </h2>

      <motion.ol
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="mt-10 grid gap-4 sm:grid-cols-3"
      >
        {SPONSOR_CLOSE.map((s, i) => (
          <motion.li
            key={s.step}
            variants={rise}
            className="rounded-2xl border border-border/70 bg-card/50 p-6"
          >
            <span className="flex size-8 items-center justify-center rounded-full border border-[var(--color-bb-cobalt)]/60 text-sm font-bold text-[var(--color-bb-cyan)]">
              {i + 1}
            </span>
            <h3 className="mt-4 font-semibold">{s.step}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.detail}</p>
          </motion.li>
        ))}
      </motion.ol>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-10 max-w-2xl text-muted-foreground"
      >
        Placements are one per position, and the best positions go first.
        Ask your Informa rep to hold yours for {config.dates}.
      </motion.p>
    </SlideFrame>
  );
}
