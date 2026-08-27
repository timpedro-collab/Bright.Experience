/**
 * Slides 5–8 of the confidential commercial plan: pricing, routes to market,
 * channel split economics, and the three-scenario revenue forecast.
 */
"use client";

import { motion } from "framer-motion";

import type { DeckShellSlideProps } from "@/components/decks/DeckShell";
import {
  CHANNELS_SLIDE,
  CHANNEL_SPLIT_SLIDE,
  FORECAST_SLIDE,
  PRICING_SLIDE,
} from "@/lib/commercial-plan/content";
import {
  forecastFor,
  formatCompactUsd,
  formatExactUsd,
  SALES_CHANNELS,
  splitExample,
} from "@/lib/commercial-plan/forecast";
import { formatTierBand, tiersForDisplay } from "@/lib/pricing/tiers";
import {
  CommercialIndex,
  CommercialOverline,
  CommercialSlideFrame,
  commercialRise,
  commercialStagger,
} from "./commercial-slide-ui";

const BASE_FORECAST = forecastFor("base");
const CONSERVATIVE_FORECAST = forecastFor("conservative");
const UPSIDE_FORECAST = forecastFor("upside");

function percent(value: number): string {
  return `${Math.round(value * 1000) / 10}%`;
}

/** Slide 5: the internal US pricing ladder from canonical tier data. */
export function CommercialPricingSlide({}: DeckShellSlideProps) {
  const tiers = tiersForDisplay();
  return (
    <CommercialSlideFrame>
      <CommercialOverline>{PRICING_SLIDE.overline}</CommercialOverline>
      <h2 className="text-display-grotesk mt-3 text-4xl sm:text-5xl">
        {PRICING_SLIDE.headline}
      </h2>
      <motion.div
        variants={commercialStagger}
        initial="hidden"
        animate="visible"
        className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
      >
        {tiers.map((tier, index) => (
          <motion.div
            key={tier.slug}
            variants={commercialRise}
            className="border-t-2 border-[var(--color-bb-cyan)] pt-5"
          >
            <div className="flex items-center justify-between">
              <CommercialIndex index={index} />
              {tier.badge === "most-popular" ? (
                <span className="rounded-full bg-[var(--color-bb-cobalt)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                  Most popular
                </span>
              ) : null}
            </div>
            <h3 className="mt-4 text-xl font-semibold">{tier.displayName}</h3>
            <p className="mt-2 min-h-10 text-sm text-muted-foreground">
              {tier.strapline}
            </p>
            <p className="mt-6 text-3xl font-semibold tracking-tight text-[var(--color-bb-cyan)]">
              {formatTierBand(tier, "us")}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">
              1–3 day activation
            </p>
            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
              {tier.reporting}
            </p>
          </motion.div>
        ))}
      </motion.div>
      <p className="mt-8 max-w-4xl text-xs leading-relaxed text-muted-foreground">
        {PRICING_SLIDE.note}
      </p>
    </CommercialSlideFrame>
  );
}

/** Slide 6: the four routes to market and their role in the system. */
export function SalesChannelsSlide({}: DeckShellSlideProps) {
  return (
    <CommercialSlideFrame>
      <CommercialOverline>{CHANNELS_SLIDE.overline}</CommercialOverline>
      <h2 className="text-display-grotesk mt-3 text-4xl sm:text-5xl">
        {CHANNELS_SLIDE.headline}
      </h2>
      <motion.div
        variants={commercialStagger}
        initial="hidden"
        animate="visible"
        className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
      >
        {SALES_CHANNELS.map((channel, index) => (
          <motion.div
            key={channel.key}
            variants={commercialRise}
            className="border-t-2 border-[var(--color-bb-cyan)] pt-5"
          >
            <CommercialIndex index={index} />
            <h3 className="mt-4 text-2xl font-semibold">{channel.label}</h3>
            <p className="mt-3 min-h-12 text-sm leading-relaxed text-muted-foreground">
              {channel.route}
            </p>
            <p className="mt-7 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--color-bb-cyan)]">
              Average modeled sale
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {formatCompactUsd(channel.averageSaleUsd)}
            </p>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              {channel.basis}
            </p>
          </motion.div>
        ))}
      </motion.div>
      <p className="mt-8 text-sm text-muted-foreground">{CHANNELS_SLIDE.note}</p>
    </CommercialSlideFrame>
  );
}

/** Slide 7: channel and Bright.Blue proceeds on a standardized $50k sale. */
export function ChannelEconomicsSlide({}: DeckShellSlideProps) {
  return (
    <CommercialSlideFrame>
      <CommercialOverline>{CHANNEL_SPLIT_SLIDE.overline}</CommercialOverline>
      <h2 className="text-display-grotesk mt-3 text-4xl sm:text-5xl">
        {CHANNEL_SPLIT_SLIDE.headline}
      </h2>
      <motion.div
        variants={commercialStagger}
        initial="hidden"
        animate="visible"
        className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
      >
        {SALES_CHANNELS.map((channel, index) => {
          const split = splitExample(channel);
          return (
            <motion.div
              key={channel.key}
              variants={commercialRise}
              className="border-t-2 border-[var(--color-bb-cyan)] pt-5"
            >
              <div className="flex items-center justify-between">
                <CommercialIndex index={index} />
                <span className="text-sm font-semibold">{channel.label}</span>
              </div>
              <div className="mt-7">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Channel gets · {percent(channel.channelShare)}
                </p>
                <p className="mt-2 text-3xl font-semibold text-[var(--color-bb-cyan)]">
                  {formatExactUsd(split.channelGetsUsd)}
                </p>
              </div>
              <div className="mt-6 border-t border-border/70 pt-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Bright.Blue gets · {percent(channel.brightBlueShare)}
                </p>
                <p className="mt-2 text-3xl font-semibold">
                  {formatExactUsd(split.brightBlueGetsUsd)}
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
      <p className="mt-8 max-w-4xl text-xs leading-relaxed text-muted-foreground">
        {CHANNEL_SPLIT_SLIDE.note}
      </p>
    </CommercialSlideFrame>
  );
}

/** Slide 8: conservative/base/upside Bright.Blue revenue for 2027–2029. */
export function BusinessForecastSlide({}: DeckShellSlideProps) {
  return (
    <CommercialSlideFrame>
      <CommercialOverline>{FORECAST_SLIDE.overline}</CommercialOverline>
      <h2 className="text-display-grotesk mt-3 text-4xl sm:text-5xl">
        {FORECAST_SLIDE.headline}
      </h2>
      <motion.div
        variants={commercialStagger}
        initial="hidden"
        animate="visible"
        className="mt-12 grid gap-10 md:grid-cols-3"
      >
        {BASE_FORECAST.map((year, index) => (
          <motion.div
            key={year.year}
            variants={commercialRise}
            className="border-t-2 border-[var(--color-bb-cyan)] pt-5"
          >
            <div className="flex items-center justify-between">
              <CommercialIndex index={index} />
              <p className="text-lg font-semibold">{year.year}</p>
            </div>
            <p className="mt-6 text-5xl font-semibold tracking-tight">
              {formatCompactUsd(year.brightBlueRevenueUsd)}
            </p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-bb-cyan)]">
              Base Bright.Blue revenue
            </p>
            <p className="mt-5 text-sm text-muted-foreground">
              {year.placements} placements
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border/70 pt-5">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                  Conservative
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {formatCompactUsd(
                    CONSERVATIVE_FORECAST[index].brightBlueRevenueUsd
                  )}
                </p>
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                  Upside
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {formatCompactUsd(
                    UPSIDE_FORECAST[index].brightBlueRevenueUsd
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
      <p className="mt-9 max-w-5xl text-xs leading-relaxed text-muted-foreground">
        {FORECAST_SLIDE.note}
      </p>
    </CommercialSlideFrame>
  );
}
