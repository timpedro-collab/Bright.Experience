/** Motion primitives — Framer Motion wrappers for fade-in, stagger, and page transitions */
"use client";

import * as React from "react";
import { motion, type HTMLMotionProps, type Variants } from "framer-motion";

/* ------------------------------------------------------------------ */
/* Easing curves & durations — Apple-style smooth                     */
/* ------------------------------------------------------------------ */

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ------------------------------------------------------------------ */
/* FadeIn — gentle vertical reveal                                    */
/* ------------------------------------------------------------------ */

interface FadeInProps extends HTMLMotionProps<"div"> {
  delay?: number;
  duration?: number;
  y?: number;
}

export function FadeIn({
  delay = 0,
  duration = 0.5,
  y = 8,
  children,
  ...props
}: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: EASE_OUT }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Stagger — animate children in sequence                             */
/* ------------------------------------------------------------------ */

interface StaggerProps extends HTMLMotionProps<"div"> {
  staggerDelay?: number;
  initialDelay?: number;
}

const STAGGER_CONTAINER: Variants = {
  hidden: {},
  visible: ({
    staggerDelay = 0.06,
    initialDelay = 0,
  }: {
    staggerDelay?: number;
    initialDelay?: number;
  }) => ({
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: initialDelay,
    },
  }),
};

const STAGGER_ITEM: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: EASE_OUT },
  },
};

export function Stagger({
  staggerDelay = 0.06,
  initialDelay = 0,
  children,
  ...props
}: StaggerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={STAGGER_CONTAINER}
      custom={{ staggerDelay, initialDelay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div variants={STAGGER_ITEM} {...props}>
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Page transition wrapper — for full route enter animations          */
/* ------------------------------------------------------------------ */

export function PageTransition({
  children,
  ...props
}: HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* AnimatedCounter — count-up for stat cards                          */
/* ------------------------------------------------------------------ */

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  formatter?: (n: number) => string;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 1.2,
  formatter = (n) => Math.round(n).toLocaleString(),
  className,
}: AnimatedCounterProps) {
  const [display, setDisplay] = React.useState(0);
  const startRef = React.useRef<number | null>(null);
  const fromRef = React.useRef(0);

  React.useEffect(() => {
    const from = fromRef.current;
    const target = value;
    let raf = 0;
    startRef.current = null;

    function step(ts: number) {
      if (startRef.current == null) startRef.current = ts;
      const elapsed = (ts - startRef.current) / 1000;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (target - from) * eased;
      setDisplay(current);
      if (t < 1) raf = requestAnimationFrame(step);
      else fromRef.current = target;
    }

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className={className}>{formatter(display)}</span>;
}
