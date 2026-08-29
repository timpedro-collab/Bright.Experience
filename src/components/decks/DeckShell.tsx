/**
 * Shared fullscreen slide shell for pitch decks — the proven chrome from
 * the Informa partnership deck (arrow keys, on-screen arrows, tappable
 * progress dots, and the slide number synced to ?slide=N so a presenter
 * can deep-link or recover after a refresh mid-meeting), extracted so new
 * decks reuse one implementation instead of copy-pasting it.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

/** Props every slide receives from the shell. */
export interface DeckShellSlideProps {
  /** Advance to the next slide (for on-slide CTAs). */
  onAdvance: () => void;
  /** This slide's 1-based position, as used in the deck's ?slide= param. */
  slideNumber: number;
}

/** One slide in a deck: a stable id and the component that renders it. */
export interface DeckShellSlide {
  id: string;
  Component: (props: DeckShellSlideProps) => React.ReactNode;
}

function clampSlide(raw: string | null, count: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.min(count - 1, Math.max(0, Math.round(n) - 1));
}

/**
 * Renders a deck of fullscreen slides with keyboard navigation, progress
 * dots and URL-synced deep-linking. Slides render inside the dark theme
 * used by every Bright.Blue pitch surface.
 */
export function DeckShell({ slides }: { slides: readonly DeckShellSlide[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [index, setIndex] = useState(() =>
    clampSlide(searchParams.get("slide"), slides.length)
  );

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.min(slides.length - 1, Math.max(0, next));
      setIndex(clamped);
      router.replace(`?slide=${clamped + 1}`, { scroll: false });
    },
    [router, slides.length]
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

  const { id, Component } = slides[index];

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
          <Component onAdvance={() => goTo(index + 1)} slideNumber={index + 1} />
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
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => goTo(i)}
              className={cn(
                "size-2 rounded-full transition-all",
                i === index
                  ? "w-6 bg-primary"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/60"
              )}
            />
          ))}
        </div>

        <button
          type="button"
          aria-label="Next slide"
          disabled={index === slides.length - 1}
          onClick={() => goTo(index + 1)}
          className="pointer-events-auto rounded-full border border-border/60 bg-card/60 p-3 text-muted-foreground backdrop-blur transition-colors hover:text-foreground disabled:opacity-30"
        >
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </nav>
    </div>
  );
}
