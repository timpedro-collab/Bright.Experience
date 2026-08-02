/** Animates a marketing stat string on scroll — parses prefix/number/suffix and count-ups when in view. */
"use client";

import * as React from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { parseStatValue } from "@/lib/stat-value";

interface StatCountUpProps {
  raw: string;
  duration?: number;
  className?: string;
  /**
   * Styles the textual prefix (e.g. the "Up to " in "Up to 40%") in its own
   * span so it can be set smaller/quieter than the animated number — a huge
   * bare number with a tiny qualifier reads better than both at one size.
   */
  prefixClassName?: string;
  /** Styles the suffix (e.g. "%" or "hr") in its own span. */
  suffixClassName?: string;
}

function formatAnimatedValue(n: number, hasDecimals: boolean): string {
  if (hasDecimals) {
    return n.toLocaleString("en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  }
  return Math.round(n).toLocaleString("en-US");
}

export function StatCountUp({
  raw,
  duration = 1.2,
  className,
  prefixClassName,
  suffixClassName,
}: StatCountUpProps) {
  const parsed = React.useMemo(() => parseStatValue(raw), [raw]);
  const prefersReduced = useReducedMotion();
  const ref = React.useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [display, setDisplay] = React.useState(0);

  const hasDecimals = parsed !== null && parsed.value % 1 !== 0;

  React.useEffect(() => {
    if (!parsed || prefersReduced || !isInView) return;

    const target = parsed.value;
    let raf = 0;
    const startTime = performance.now();

    function step(now: number) {
      const elapsed = (now - startTime) / 1000;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(target * eased);
      if (t < 1) raf = requestAnimationFrame(step);
    }

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [parsed, prefersReduced, isInView, duration]);

  if (!parsed) {
    return <span className={className}>{raw}</span>;
  }

  const finalFormatted = formatAnimatedValue(parsed.value, hasDecimals);
  const numberShown = prefersReduced
    ? finalFormatted
    : formatAnimatedValue(isInView ? display : 0, hasDecimals);

  return (
    <span ref={prefersReduced ? undefined : ref} className={className}>
      {parsed.prefix &&
        (prefixClassName ? (
          <span className={prefixClassName}>{parsed.prefix}</span>
        ) : (
          parsed.prefix
        ))}
      {numberShown}
      {parsed.suffix &&
        (suffixClassName ? (
          <span className={suffixClassName}>{parsed.suffix}</span>
        ) : (
          parsed.suffix
        ))}
    </span>
  );
}
