/**
 * VersionCompareSlider — two versions of an artwork in one frame with a
 * draggable reveal line (Frame.io comparison-viewer pattern,
 * docs/18-design-research.md R3.2). For vinyl wraps and print artwork a
 * slider beats side-by-side panes: the eye holds one fixed point while the
 * line sweeps, so a two-pixel logo shift is impossible to miss. Fully
 * keyboard-operable (arrow keys nudge, Home/End snap).
 */
"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface CompareImage {
  /** Short chip label, e.g. "v2". */
  label: string;
  url: string;
}

interface VersionCompareSliderProps {
  /** The older version — revealed on the left of the line. */
  before: CompareImage;
  /** The newer version — revealed on the right of the line. */
  after: CompareImage;
  className?: string;
}

export function VersionCompareSlider({
  before,
  after,
  className,
}: VersionCompareSliderProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState(50);
  const draggingRef = React.useRef(false);

  const updateFromPointer = React.useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  }, []);

  React.useEffect(() => {
    function onMove(e: PointerEvent) {
      if (draggingRef.current) updateFromPointer(e.clientX);
    }
    function onUp() {
      draggingRef.current = false;
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [updateFromPointer]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") setPosition((p) => Math.max(0, p - 2));
    else if (e.key === "ArrowRight") setPosition((p) => Math.min(100, p + 2));
    else if (e.key === "Home") setPosition(0);
    else if (e.key === "End") setPosition(100);
    else return;
    e.preventDefault();
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative select-none overflow-hidden rounded-2xl border border-border bg-[repeating-conic-gradient(var(--color-muted)_0%_25%,transparent_0%_50%)] bg-[length:20px_20px]",
        className
      )}
      onPointerDown={(e) => {
        draggingRef.current = true;
        updateFromPointer(e.clientX);
      }}
    >
      {/* Older version underneath, full width. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={before.url}
        alt={`Version ${before.label}`}
        draggable={false}
        className="block max-h-[60vh] w-full object-contain"
      />
      {/* Newer version above, revealed right of the line. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ clipPath: `inset(0 0 0 ${position}%)` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={after.url}
          alt=""
          draggable={false}
          className="block h-full w-full object-contain"
        />
      </div>

      {/* Version chips — scrim labels over artwork stay literal per design-language §2. */}
      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
        {before.label}
      </span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-primary/85 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-widest text-primary-foreground backdrop-blur-sm">
        {after.label}
      </span>

      {/* The reveal line + handle (the focusable slider control). */}
      <div
        role="slider"
        tabIndex={0}
        aria-label={`Compare ${before.label} with ${after.label}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        aria-orientation="horizontal"
        onKeyDown={onKeyDown}
        className="absolute inset-y-0 z-10 w-0.5 cursor-ew-resize bg-foreground shadow-[0_0_0_1px_rgba(0,0,0,0.25)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ left: `${position}%` }}
      >
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-popover text-[0.625rem] font-bold text-foreground shadow-md"
        >
          ⇄
        </span>
      </div>
    </div>
  );
}
