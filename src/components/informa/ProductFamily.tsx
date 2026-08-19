/**
 * The rate-card product family: five named products as selectable tiles,
 * with a focused detail panel that changes via the redesign's lock-step
 * carousel (outgoing panel exits one side as the incoming one slides in,
 * same duration and easing, so they fly in formation).
 */
"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRetailBand, PRODUCT_FAMILY } from "@/lib/informa/products";
import { cn } from "@/lib/utils";

/** Theo's carousel signature: 720ms, lock-step easing, 115% travel. */
const CAROUSEL_EASE = [0.45, 0.05, 0.25, 1] as const;
const CAROUSEL = {
  enter: (direction: number) => ({ x: `${direction * 115}%`, opacity: 1 }),
  center: { x: "0%", opacity: 1 },
  exit: (direction: number) => ({ x: `${direction * -115}%`, opacity: 1 }),
};

export function ProductFamily({
  onPriceProduct,
  variant = "organizer",
}: {
  /** Wired by the kit page: presets the configurator and scrolls to it. */
  onPriceProduct?: (priceUsd: number) => void;
  /**
   * "organizer" (kit): all five products, retail bands, buyer badges.
   * "sponsor" (sponsor deck): sponsor-relevant products only, no pricing —
   * the price conversation belongs to the Informa rep.
   */
  variant?: "organizer" | "sponsor";
}) {
  const products =
    variant === "sponsor"
      ? PRODUCT_FAMILY.filter((p) => p.id !== "rebooker")
      : PRODUCT_FAMILY;
  const showPricing = variant === "organizer";

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const select = (next: number) => {
    if (next === index) return;
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  };

  const product = products[index];

  return (
    <div className="space-y-6">
      <div
        className={cn(
          "grid gap-3 sm:grid-cols-2",
          products.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
        )}
        role="tablist"
        aria-label="Products"
      >
        {products.map((p, i) => {
          const active = i === index;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => select(i)}
              className={cn(
                "rounded-2xl border p-5 text-left transition-colors",
                active
                  ? "border-[var(--color-bb-cobalt)] bg-[var(--color-bb-cobalt)]/10"
                  : "border-border/70 bg-card/50 hover:border-[var(--color-bb-cobalt)]/50"
              )}
            >
              <p className="text-display-grotesk text-xl">{p.name}</p>
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-widest text-[var(--color-bb-cyan)]">
                {p.descriptor}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.tagline}</p>
              {showPricing ? (
                <p className="mt-3 text-xs font-semibold tabular-nums text-foreground/90">
                  {formatRetailBand(p)}
                </p>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={product.id}
            custom={direction}
            variants={CAROUSEL}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.72, ease: CAROUSEL_EASE }}
            className="rounded-2xl border border-border/70 bg-card/50 p-6 sm:p-8"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-display-grotesk text-2xl">
                  {product.name}
                  <span className="text-muted-foreground"> · {product.descriptor}</span>
                </h3>
                <p className="mt-2 max-w-2xl leading-relaxed text-muted-foreground">
                  {product.placement}
                </p>
              </div>
              {showPricing ? (
                <Badge variant="outline" className="shrink-0 border-[var(--color-bb-cobalt)]/50">
                  Buyer: {product.buyer}
                </Badge>
              ) : null}
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  What is included
                </p>
                <ul className="mt-3 space-y-2">
                  {product.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                      <Check className="mt-0.5 size-4 shrink-0 text-[var(--color-bb-cyan)]" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    What the report measures
                  </p>
                  <ul className="mt-3 space-y-2">
                    {product.measures.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                        <Check className="mt-0.5 size-4 shrink-0 text-[var(--color-bb-cyan)]" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                {showPricing ? (
                  <div className="rounded-xl border border-[var(--color-bb-cobalt)]/50 bg-[var(--color-bb-cobalt)]/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Suggested retail
                    </p>
                    <p className="mt-1 text-xl font-semibold tabular-nums">{formatRetailBand(product)}</p>
                    {product.configuratorPrice != null && onPriceProduct ? (
                      <Button
                        size="sm"
                        className="mt-3 gap-2"
                        onClick={() => onPriceProduct(product.configuratorPrice!)}
                      >
                        <SlidersHorizontal className="size-4" aria-hidden />
                        Price this in the configurator
                      </Button>
                    ) : null}
                    {product.id === "loop" ? (
                      // Slots sell as media, so the pitch continues in the
                      // media-kit section further down the kit page.
                      <a
                        href="#media-kit"
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-bb-cyan)] hover:underline"
                      >
                        See the media kit
                        <ArrowRight className="size-4" aria-hidden />
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous product"
          disabled={index === 0}
          onClick={() => select(index - 1)}
        >
          <ArrowLeft className="size-4" aria-hidden />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Next product"
          disabled={index === products.length - 1}
          onClick={() => select(index + 1)}
        >
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
