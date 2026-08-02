"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "video[controls]",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

interface ModalOverlayOptions {
  /** Whether the overlay is currently on screen. */
  active: boolean;
  /** Escape, and the backdrop click handler, both route here. */
  onClose: () => void;
  /** Optional left/right arrow handlers for galleries and step flows. */
  onPrev?: () => void;
  onNext?: () => void;
  /**
   * Keep Tab inside the overlay. Off for overlays that deliberately leave the
   * page behind them usable — the product tour's "click this button" steps.
   */
  trapFocus?: boolean;
  /** Lock background scrolling while open. Defaults to the trap setting. */
  lockScroll?: boolean;
  /**
   * Move focus to the container itself rather than its first focusable child.
   * Use when the overlay's text matters more than its controls, so a screen
   * reader reads the heading before landing on a button.
   */
  focusContainer?: boolean;
  /**
   * Changing this re-runs the focus move without treating the overlay as
   * reopened — for multi-step overlays where each step is new content.
   */
  focusKey?: string | number;
}

/**
 * Wires the keyboard and focus behaviour a modal overlay needs to be usable
 * without a mouse: Escape to close, optional arrow-key navigation, focus moved
 * into the overlay on open and returned to the trigger on close, and Tab kept
 * inside while it is open.
 *
 * Radix gives us all of this for free in `Dialog`, but the two hand-rolled
 * overlays in the app (the catalogue lightbox and the product-tour coachmark)
 * are positioned in ways Radix can't express, so they need it explicitly.
 * Without it a keyboard user opens the lightbox and is stranded: Escape does
 * nothing, Tab walks the page hidden behind the scrim, and focus never returns.
 *
 * Returns a ref to attach to the overlay's outermost element.
 */
export function useModalOverlay<T extends HTMLElement>({
  active,
  onClose,
  onPrev,
  onNext,
  trapFocus = true,
  lockScroll,
  focusContainer = false,
  focusKey,
}: ModalOverlayOptions) {
  const containerRef = useRef<T | null>(null);
  // Latest handlers, so the key listener doesn't need re-binding every render.
  const handlers = useRef({ onClose, onPrev, onNext });
  useEffect(() => {
    handlers.current = { onClose, onPrev, onNext };
  });
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // Remember the trigger on open and hand focus back to it on close, so the
  // user resumes where they were rather than at the top of the document.
  useEffect(() => {
    if (!active) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    return () => {
      const trigger = returnFocusRef.current;
      returnFocusRef.current = null;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [active]);

  // Move focus into the overlay on open, and again whenever its content changes.
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;
    const first = focusContainer
      ? null
      : container.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? container).focus({ preventScroll: true });
  }, [active, focusContainer, focusKey]);

  useEffect(() => {
    if (!active) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handlers.current.onClose();
        return;
      }
      // Arrow keys must not hijack typing or a native control's own handling.
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable === true;

      if (!typing && event.key === "ArrowLeft" && handlers.current.onPrev) {
        event.preventDefault();
        handlers.current.onPrev();
        return;
      }
      if (!typing && event.key === "ArrowRight" && handlers.current.onNext) {
        event.preventDefault();
        handlers.current.onNext();
        return;
      }

      if (event.key !== "Tab" || !trapFocus) return;
      const container = containerRef.current;
      if (!container) return;
      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (focusable.length === 0) {
        // Nothing to land on: keep focus on the overlay rather than letting it
        // escape to the page underneath.
        event.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }
      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];
      const activeEl = document.activeElement;
      if (event.shiftKey && (activeEl === firstEl || activeEl === container)) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && activeEl === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [active, trapFocus]);

  useEffect(() => {
    const shouldLock = lockScroll ?? trapFocus;
    if (!active || !shouldLock) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active, lockScroll, trapFocus]);

  return containerRef;
}
