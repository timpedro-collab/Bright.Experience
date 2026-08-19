/**
 * Fullscreen slide shell for the Bright.Blue × Informa pitch.
 *
 * Presentation affordances over app affordances: arrow keys, on-screen
 * arrows, tappable progress dots, and the slide number synced to ?slide=N so
 * a presenter can deep-link or recover after a refresh mid-meeting.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

import {
  CoverSlide,
  GapSlide,
  JourneySlide,
  TampaSlide,
} from "./deck-slides-story";
import {
  AskSlide,
  KitPreviewSlide,
  RenewalSlide,
  SkuSlide,
} from "./deck-slides-offer";
import { TwoModelsSlide } from "./deck-slides-models";
import { cn } from "@/lib/utils";

const SLIDES = [
  { id: "cover", Component: CoverSlide },
  { id: "tampa", Component: TampaSlide },
  { id: "journey", Component: JourneySlide },
  { id: "gap", Component: GapSlide },
  { id: "sku", Component: SkuSlide },
  { id: "models", Component: TwoModelsSlide },
  { id: "renewal", Component: RenewalSlide },
  { id: "kit", Component: KitPreviewSlide },
  { id: "ask", Component: AskSlide },
] as const;

function clampSlide(raw: string | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.min(SLIDES.length - 1, Math.max(0, Math.round(n) - 1));
}

export function InformaPitchDeck() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [index, setIndex] = useState(() => clampSlide(searchParams.get("slide")));

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.min(SLIDES.length - 1, Math.max(0, next));
      setIndex(clamped);
      router.replace(`?slide=${clamped + 1}`, { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        goTo(index + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        goTo(index - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, goTo]);

  const { id, Component } = SLIDES[index];

  return (
    <div className="theme-dark relative flex min-h-dvh flex-col overflow-hidden bg-background text-foreground">
      <AnimatePresence mode="wait">
        <motion.div
          key={id}
          className="flex min-h-0 flex-1"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <Component onAdvance={() => goTo(index + 1)} />
        </motion.div>
      </AnimatePresence>

      {/* Chrome: dots + arrows, kept out of the slide content's way */}
      <nav
        aria-label="Slides"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-4 px-5 pb-5 sm:px-8"
      >
        <button
          type="button"
          aria-label="Previous slide"
          disabled={index === 0}
          onClick={() => goTo(index - 1)}
          className="pointer-events-auto rounded-full border border-border/60 bg-card/60 p-3 text-muted-foreground backdrop-blur transition-colors hover:text-foreground disabled:opacity-30"
        >
          <ArrowLeft className="size-4" aria-hidden />
        </button>

        <div className="pointer-events-auto flex items-center gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => goTo(i)}
              className={cn(
                "size-2 rounded-full transition-all",
                i === index
                  ? "w-6 bg-[var(--color-bb-cobalt)]"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/60"
              )}
            />
          ))}
        </div>

        <button
          type="button"
          aria-label="Next slide"
          disabled={index === SLIDES.length - 1}
          onClick={() => goTo(index + 1)}
          className="pointer-events-auto rounded-full border border-border/60 bg-card/60 p-3 text-muted-foreground backdrop-blur transition-colors hover:text-foreground disabled:opacity-30"
        >
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </nav>
    </div>
  );
}
