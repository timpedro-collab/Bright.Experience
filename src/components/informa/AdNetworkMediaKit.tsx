/**
 * Screen Ad Network media kit for the Informa seller's kit: the measured
 * funnel, per-slot delivery metrics and slot mechanics, framed the way an
 * ad-slot buyer evaluates media. All numbers derive from
 * `@/lib/informa/ad-network` (which in turn derives from the sample
 * report), so this section can never contradict the report.
 */
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";

import {
  AD_LOOP_MECHANICS,
  adNetworkFunnel,
  SLOT_MECHANICS,
  slotMetrics,
} from "@/lib/informa/ad-network";
import { formatCount, formatUsdWhole } from "@/lib/informa/kit-math";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const rise = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function AdNetworkMediaKit() {
  const funnel = adNetworkFunnel();
  const metrics = slotMetrics();
  const { retail, slotsPerLoop, slotSeconds } = AD_LOOP_MECHANICS;

  const statTiles = [
    {
      label: "The loop",
      value: `${slotsPerLoop} × ${slotSeconds}s`,
      detail: "slots per rolling loop",
    },
    {
      label: "Delivery per slot",
      value: formatCount(metrics.playsPerSlot),
      detail: "logged creative plays on the sample show",
    },
    {
      label: "Brand screen time",
      value: `${formatCount(metrics.screenMinutesPerSlot)} min`,
      detail: "per slot across the run, measured",
    },
    {
      label: "Share of voice",
      value: `1 in ${slotsPerLoop}`,
      detail: "per slot — or take the loop sole-advertiser",
    },
  ];

  return (
    <div className="space-y-8">
      <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
        The screens between plays are media inventory, and they sell the way
        media buyers already buy: a priced slot, a known share of voice, and
        delivery counts that are logged on the machine instead of modelled
        from footfall. These figures come straight from the sample show.
      </p>

      {/* The measured funnel, widest stage first */}
      <motion.ol
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        className="grid gap-3 md:grid-cols-3"
        aria-label="Measured funnel from the sample show"
      >
        {funnel.map((stage, i) => (
          <motion.li key={stage.key} variants={rise} className="relative">
            <div className="h-full rounded-2xl border border-border/70 bg-card/50 p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-bb-cobalt)]">
                {String(i + 1).padStart(2, "0")} · {stage.label}
              </p>
              <p className="mt-3 text-3xl font-bold tabular-nums text-heading">
                {formatCount(stage.value)}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {stage.detail}
              </p>
            </div>
            {i < funnel.length - 1 ? (
              <ChevronRight
                aria-hidden
                className="absolute -right-2.5 top-1/2 z-10 hidden size-5 -translate-y-1/2 text-muted-foreground/60 md:block"
              />
            ) : null}
          </motion.li>
        ))}
      </motion.ol>

      {/* Per-slot stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statTiles.map((tile) => (
          <div
            key={tile.label}
            className="rounded-xl border border-[var(--color-bb-cobalt)]/40 bg-[var(--color-bb-cobalt)]/5 px-4 py-3"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-bb-cyan)]">
              {tile.label}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{tile.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{tile.detail}</p>
          </div>
        ))}
      </div>

      {/* Slot mechanics */}
      <div className="grid gap-4 md:grid-cols-3">
        {SLOT_MECHANICS.map((item) => (
          <div key={item.title} className="rounded-2xl border border-border/70 bg-card/50 p-6">
            <h3 className="font-semibold text-[var(--color-bb-cyan)]">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {item.detail}
            </p>
          </div>
        ))}
      </div>

      {/* Price + proof */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--color-bb-cobalt)]/50 bg-[var(--color-bb-cobalt)]/10 p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Rate card
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {formatUsdWhole(retail.min)} to {formatUsdWhole(retail.max)}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              {retail.unit}
            </span>
          </p>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Every advertiser gets the same logged delivery counts in the
            post-show report the sponsors get.
          </p>
        </div>
        <Link
          href="/informa/report"
          className="inline-flex items-center gap-2 rounded-lg border border-border/70 px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--color-bb-cyan)] hover:text-[var(--color-bb-cyan)]"
        >
          See the ad loop in the sample report
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
