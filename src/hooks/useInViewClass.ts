/** Adds `is-inview` on mobile-portrait when fully visible — hysteresis via dual IntersectionObservers. */
"use client";

import { useCallback, useEffect, useRef } from "react";

const MOBILE_PORTRAIT_MQ = "(max-width: 767px) and (orientation: portrait)";

/**
 * Adds `is-inview` to the element on mobile-portrait viewports when fully visible, removing it only once fully out of view (+100px margin) — hysteresis prevents boundary flicker. Desktop is untouched (CSS :hover drives the same styles). Returns a ref callback.
 */
export function useInViewClass(options?: {
  className?: string;
}): (node: HTMLElement | null) => void {
  const className = options?.className ?? "is-inview";
  const addObserverRef = useRef<IntersectionObserver | null>(null);
  const removeObserverRef = useRef<IntersectionObserver | null>(null);

  const cleanup = useCallback(() => {
    addObserverRef.current?.disconnect();
    removeObserverRef.current?.disconnect();
    addObserverRef.current = null;
    removeObserverRef.current = null;
  }, []);

  const refCallback = useCallback(
    (node: HTMLElement | null) => {
      cleanup();

      if (!node) return;
      if (typeof window === "undefined") return;
      if (!window.matchMedia(MOBILE_PORTRAIT_MQ).matches) return;

      const addObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting && entry.intersectionRatio >= 1) {
              entry.target.classList.add(className);
            }
          }
        },
        { threshold: 1 }
      );

      const removeObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) {
              entry.target.classList.remove(className);
            }
          }
        },
        { threshold: 0, rootMargin: "100px 0px 100px 0px" }
      );

      addObserver.observe(node);
      removeObserver.observe(node);
      addObserverRef.current = addObserver;
      removeObserverRef.current = removeObserver;
    },
    [className, cleanup]
  );

  useEffect(() => cleanup, [cleanup]);

  return refCallback;
}
