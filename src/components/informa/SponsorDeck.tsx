/**
 * The sponsor-facing deck engine: same fullscreen slide shell as the
 * organizer pitch, plus per-show templating. Show values arrive via search
 * params (`?show=&dates=&attendees=&days=`), and a rep can retune them live
 * from the "Set up your show" panel, which also mints a shareable link.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Link2, Settings2, X } from "lucide-react";

import {
  SponsorHookSlide,
  SponsorJourneySlide,
  SponsorPlacementSlide,
  StandVisionSlide,
  type SponsorSlideProps,
} from "./sponsor-slides-story";
import {
  SponsorCloseSlide,
  SponsorNumbersSlide,
  SponsorProofSlide,
  SponsorReportSlide,
} from "./sponsor-slides-close";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  parseShowConfig,
  SHOW_LIMITS,
  showConfigQuery,
  type ShowConfig,
} from "@/lib/informa/sponsor-content";
import { cn } from "@/lib/utils";

const SLIDES: { id: string; Component: (props: SponsorSlideProps) => React.ReactNode }[] = [
  { id: "hook", Component: SponsorHookSlide },
  { id: "stand", Component: StandVisionSlide },
  { id: "journey", Component: SponsorJourneySlide },
  { id: "placement", Component: SponsorPlacementSlide },
  { id: "numbers", Component: SponsorNumbersSlide },
  { id: "proof", Component: SponsorProofSlide },
  { id: "report", Component: SponsorReportSlide },
  { id: "close", Component: SponsorCloseSlide },
];

function clampSlide(raw: string | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.min(SLIDES.length - 1, Math.max(0, Math.round(n) - 1));
}

/** The rep's inline show editor: retune the deck mid-meeting, copy a link. */
function ShowSetupPanel({
  config,
  onChange,
  onClose,
}: {
  config: ShowConfig;
  onChange: (next: ShowConfig) => void;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      const url = `${window.location.origin}/informa/sponsor?${showConfigQuery(config)}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable; the fields still show the values */
    }
  };

  return (
    <div className="w-80 rounded-2xl border border-border/70 bg-card/95 p-5 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Set up your show</p>
        <button
          type="button"
          aria-label="Close show setup"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <div className="mt-4 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="sponsor-show">Show</Label>
          <Input
            id="sponsor-show"
            value={config.show}
            onChange={(e) => onChange({ ...config, show: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sponsor-dates">Dates</Label>
          <Input
            id="sponsor-dates"
            value={config.dates}
            onChange={(e) => onChange({ ...config, dates: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="sponsor-attendees">Attendees</Label>
            <Input
              id="sponsor-attendees"
              type="number"
              min={SHOW_LIMITS.attendees.min}
              max={SHOW_LIMITS.attendees.max}
              value={config.attendees}
              onChange={(e) =>
                onChange({ ...config, attendees: Number(e.target.value) || 0 })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sponsor-days">Days</Label>
            <Input
              id="sponsor-days"
              type="number"
              min={SHOW_LIMITS.days.min}
              max={SHOW_LIMITS.days.max}
              value={config.days}
              onChange={(e) =>
                onChange({ ...config, days: Number(e.target.value) || 1 })
              }
            />
          </div>
        </div>
        <Button onClick={copyLink} variant="outline" size="sm" className="w-full gap-2">
          {copied ? <Check className="size-4" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
          {copied ? "Link copied" : "Copy link for this show"}
        </Button>
      </div>
    </div>
  );
}

export function SponsorDeck() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [index, setIndex] = useState(() => clampSlide(searchParams.get("slide")));
  const [config, setConfig] = useState<ShowConfig>(() =>
    parseShowConfig(Object.fromEntries(searchParams.entries()))
  );
  const [setupOpen, setSetupOpen] = useState(false);

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.min(SLIDES.length - 1, Math.max(0, next));
      setIndex(clamped);
      router.replace(`?${showConfigQuery(config)}&slide=${clamped + 1}`, {
        scroll: false,
      });
    },
    [router, config]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't hijack keys while the rep types in the setup panel.
      if ((e.target as HTMLElement | null)?.tagName === "INPUT") return;
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

  // Re-clamp free-typed numbers when the panel closes, not on every keystroke.
  const closeSetup = () => {
    setConfig((c) => parseShowConfig({
      show: c.show,
      dates: c.dates,
      attendees: String(c.attendees),
      days: String(c.days),
    }));
    setSetupOpen(false);
  };

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
          <Component config={config} onAdvance={() => goTo(index + 1)} />
        </motion.div>
      </AnimatePresence>

      {/* Rep tools: show setup, top-right and out of the sponsor's eye line */}
      <div className="absolute right-5 top-5 z-20 flex flex-col items-end gap-3">
        <button
          type="button"
          aria-label="Set up your show"
          aria-expanded={setupOpen}
          onClick={() => (setupOpen ? closeSetup() : setSetupOpen(true))}
          className="rounded-full border border-border/60 bg-card/60 p-3 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
        >
          <Settings2 className="size-4" aria-hidden />
        </button>
        {setupOpen ? (
          <ShowSetupPanel config={config} onChange={setConfig} onClose={closeSetup} />
        ) : null}
      </div>

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
                  ? "w-6 bg-primary"
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
