"use client";

/**
 * TourSpotlight — the live coachmark engine.
 *
 * Instead of a full-screen illustrated slideshow, this dims the *real* page,
 * cuts a highlight around an actual element (resolved from the step's `target`),
 * and floats a tooltip beside it. Steps with an `action` keep the element
 * genuinely clickable and advance the moment the user performs it — so the tour
 * teaches by doing. When a step has no target (or it can't be found), the
 * tooltip falls back to a centred card with an optional illustration.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTour } from "./TourProvider";
import { TourVisualRenderer } from "./tour-visuals";

const CARD_WIDTH = 360;
const GAP = 16;
const PADDING = 8; // halo around the target
const VIEWPORT_MARGIN = 16;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function resolveSelector(target: string): string {
  return /^[[.#]/.test(target) ? target : `[data-tour="${target}"]`;
}

function rectOf(el: Element): Rect {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export function TourSpotlight() {
  const {
    phase,
    currentStep,
    currentStepIndex,
    totalSteps,
    next,
    prev,
    skip,
    finish,
  } = useTour();

  const [rect, setRect] = useState<Rect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const targetElRef = useRef<HTMLElement | null>(null);

  const active = phase === "touring" && !!currentStep;
  const target = currentStep?.target ?? null;
  const placement = currentStep?.placement ?? "bottom";

  // Resolve + track the target element's rect.
  const measure = useCallback(() => {
    if (!target) {
      setRect(null);
      targetElRef.current = null;
      return;
    }
    const el = document.querySelector<HTMLElement>(resolveSelector(target));
    targetElRef.current = el;
    setRect(el ? rectOf(el) : null);
  }, [target]);

  // On step change: scroll target into view, then measure across a few frames
  // so we catch the scroll/layout settling.
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let count = 0;

    if (target) {
      const el = document.querySelector<HTMLElement>(resolveSelector(target));
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    const tick = () => {
      measure();
      count += 1;
      if (count < 40) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, currentStepIndex, target, measure]);

  // Keep the rect synced on scroll/resize.
  useEffect(() => {
    if (!active) return;
    const onMove = () => measure();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [active, measure]);

  // Advance when the user actually performs the step's action.
  useEffect(() => {
    if (!active || !currentStep?.action) return;
    const el = targetElRef.current;
    if (!el) return;
    const action = currentStep.action;
    const handler = () => {
      if (action.endsTour) finish();
      else next();
    };
    el.addEventListener("click", handler, { once: true });
    return () => el.removeEventListener("click", handler);
  }, [active, currentStep, rect, next, finish]);

  // Position the tooltip card relative to the target (or centre as fallback).
  // We mutate the node directly in a layout effect (before paint) rather than
  // through state, which keeps positioning out of the render cycle entirely.
  useLayoutEffect(() => {
    if (!active) return;
    const card = cardRef.current;
    if (!card) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const ch = card.offsetHeight || 200;
    const cw = card.offsetWidth || CARD_WIDTH;

    let top: number;
    let left: number;

    if (!rect) {
      top = Math.max(VIEWPORT_MARGIN, vh / 2 - ch / 2);
      left = Math.max(VIEWPORT_MARGIN, vw / 2 - cw / 2);
    } else {
      switch (placement) {
        case "top":
          top = rect.top - ch - GAP;
          left = rect.left + rect.width / 2 - cw / 2;
          break;
        case "left":
          top = rect.top + rect.height / 2 - ch / 2;
          left = rect.left - cw - GAP;
          break;
        case "right":
          top = rect.top + rect.height / 2 - ch / 2;
          left = rect.left + rect.width + GAP;
          break;
        default:
          top = rect.top + rect.height + GAP;
          left = rect.left + rect.width / 2 - cw / 2;
      }

      // Flip if the preferred side would overflow the viewport.
      if (placement === "bottom" && top + ch > vh - VIEWPORT_MARGIN) {
        top = rect.top - ch - GAP;
      }
      if (placement === "top" && top < VIEWPORT_MARGIN) {
        top = rect.top + rect.height + GAP;
      }
    }

    const clampTop = (v: number) =>
      Math.min(Math.max(VIEWPORT_MARGIN, v), vh - ch - VIEWPORT_MARGIN);
    const clampLeft = (v: number) =>
      Math.min(Math.max(VIEWPORT_MARGIN, v), vw - cw - VIEWPORT_MARGIN);

    top = clampTop(top);
    left = clampLeft(left);

    // Never cover the spotlighted element itself — if the clamped card would
    // overlap the halo (common for edge targets on narrow viewports), move it
    // to the first side with room: right, left, below, then above.
    if (rect) {
      const h = {
        left: rect.left - PADDING,
        top: rect.top - PADDING,
        right: rect.left + rect.width + PADDING,
        bottom: rect.top + rect.height + PADDING,
      };
      const overlaps = () =>
        left < h.right && left + cw > h.left && top < h.bottom && top + ch > h.top;
      if (overlaps()) {
        if (h.right + GAP + cw <= vw - VIEWPORT_MARGIN) {
          left = h.right + GAP;
          top = clampTop(rect.top + rect.height / 2 - ch / 2);
        } else if (h.left - GAP - cw >= VIEWPORT_MARGIN) {
          left = h.left - GAP - cw;
          top = clampTop(rect.top + rect.height / 2 - ch / 2);
        } else if (h.bottom + GAP + ch <= vh - VIEWPORT_MARGIN) {
          top = h.bottom + GAP;
          left = clampLeft(rect.left + rect.width / 2 - cw / 2);
        } else {
          top = clampTop(h.top - GAP - ch);
          left = clampLeft(rect.left + rect.width / 2 - cw / 2);
        }
      }
    }

    card.style.top = `${top}px`;
    card.style.left = `${left}px`;
  }, [active, rect, placement, currentStepIndex]);

  if (!active || !currentStep) return null;

  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === totalSteps - 1;
  const hasAction = Boolean(currentStep.action);
  const halo = rect
    ? {
        top: rect.top - PADDING,
        left: rect.left - PADDING,
        width: rect.width + PADDING * 2,
        height: rect.height + PADDING * 2,
      }
    : null;

  return (
    <div className="fixed inset-0 z-[10001] pointer-events-none" aria-live="polite">
      {/* Scrim — full backdrop when centred, 4 panels around the target when
          anchored so the element shows through at full brightness. Panels are
          interactive (block stray clicks); the hole is left open for action
          steps and covered by a blocker for non-action steps. */}
      {halo ? (
        <>
          <div
            className="absolute left-0 right-0 top-0 bg-[#060924]/80 backdrop-blur-[1px] pointer-events-auto"
            style={{ height: Math.max(0, halo.top) }}
          />
          <div
            className="absolute left-0 right-0 bottom-0 bg-[#060924]/80 backdrop-blur-[1px] pointer-events-auto"
            style={{ top: halo.top + halo.height }}
          />
          <div
            className="absolute left-0 bg-[#060924]/80 backdrop-blur-[1px] pointer-events-auto"
            style={{ top: halo.top, height: halo.height, width: Math.max(0, halo.left) }}
          />
          <div
            className="absolute right-0 bg-[#060924]/80 backdrop-blur-[1px] pointer-events-auto"
            style={{ top: halo.top, height: halo.height, left: halo.left + halo.width }}
          />
          {/* Highlight ring */}
          <motion.div
            className="absolute rounded-[14px] ring-2 ring-[var(--color-bb-cyan)] pointer-events-none"
            style={{
              top: halo.top,
              left: halo.left,
              width: halo.width,
              height: halo.height,
            }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              ...(currentStep.highlightPulse !== false
                ? { scale: [1, 1.012, 1] }
                : {}),
            }}
            transition={{
              opacity: { duration: 0.25 },
              scale: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
            }}
          />
          {/* Non-action steps: block clicks on the spotlighted element so the
              tour stays in control. Action steps leave it interactive. */}
          {!hasAction && (
            <div
              className="absolute pointer-events-auto"
              style={{
                top: halo.top,
                left: halo.left,
                width: halo.width,
                height: halo.height,
              }}
            />
          )}
        </>
      ) : (
        <div className="absolute inset-0 bg-[#060924]/85 backdrop-blur-[2px] pointer-events-auto" />
      )}

      {/* Tooltip / card. The OUTER div owns positioning (mutated imperatively
          in the layout effect); the inner motion.div owns the enter/exit
          animation. Keeping these separate stops framer-motion from clobbering
          our top/left on every animation frame. */}
      <div
        ref={cardRef}
        className="absolute pointer-events-auto w-[360px] max-w-[calc(100vw-32px)]"
        style={{ top: 0, left: 0 }}
      >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStepIndex}
          className="theme-dark w-full rounded-2xl border border-white/10 bg-[#0b0f30]/95 p-5 text-foreground shadow-2xl"
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
        >
          {!rect && currentStep.visual && (
            <div className="mb-4">
              <TourVisualRenderer visual={currentStep.visual} />
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-bb-cyan)] font-medium">
              Step {currentStepIndex + 1} of {totalSteps}
            </span>
            <button
              onClick={skip}
              className="text-[11px] text-white/30 hover:text-white/60 transition-colors"
            >
              Skip tour
            </button>
          </div>

          <h2 className="mt-2 text-lg font-bold text-white leading-snug">
            {currentStep.title}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-white/55">
            {currentStep.description}
          </p>

          {hasAction && currentStep.action && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-[var(--color-bb-cyan)]/30 bg-[var(--color-bb-cyan)]/10 px-3 py-2 text-xs text-[var(--color-bb-cyan)]">
              <MousePointerClick className="size-3.5 shrink-0" />
              <span>{currentStep.action.hint}</span>
            </div>
          )}

          {/* Progress dots */}
          <div className="mt-4 flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === currentStepIndex
                    ? "w-5 bg-[var(--color-bb-cyan)]"
                    : i < currentStepIndex
                      ? "w-1.5 bg-white/25"
                      : "w-1.5 bg-white/10"
                }`}
              />
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <div>
              {!isFirst && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 text-white/45 hover:text-white hover:bg-white/5 gap-1.5"
                  onClick={prev}
                >
                  <ArrowLeft className="size-4" />
                  Back
                </Button>
              )}
            </div>
            <Button
              variant="brand"
              size="sm"
              className="h-9 px-5 text-sm font-semibold gap-1.5"
              onClick={next}
            >
              {hasAction ? "Skip step" : isLast ? "Finish" : "Next"}
              {!isLast && !hasAction && <ArrowRight className="size-4" />}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
      </div>
    </div>
  );
}
