"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Activity, Users, Zap } from "lucide-react";

function useCountUp(target: number, delay: number, duration: number) {
  const prefersReduced = useReducedMotion();
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (prefersReduced) return;

    const startTime = Date.now() + delay;
    const endTime = startTime + duration;
    const frame = () => {
      const now = Date.now();
      if (now < startTime) {
        requestAnimationFrame(frame);
        return;
      }
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (now < endTime) requestAnimationFrame(frame);
    };
    const raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [target, delay, duration, prefersReduced]);
  return prefersReduced ? target : value;
}

const CHART_POINTS = [12, 28, 35, 52, 48, 67, 72, 88, 95, 110, 124, 138];

export function LiveDashboard() {
  const plays = useCountUp(1247, 600, 2000);
  const leads = useCountUp(342, 800, 2000);
  const conv = useCountUp(27, 1000, 2000);

  return (
    <div className="w-full max-w-sm mx-auto space-y-4">
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {/* The real live dashboard renders "Live" in the success tone. */}
        <motion.span
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/15 border border-success/30 text-[10px] font-bold text-success uppercase tracking-wider"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <span className="size-1.5 rounded-full bg-success" />
          Live
        </motion.span>
        <span className="text-[10px] text-muted-foreground/50">Updates every 10s</span>
      </motion.div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Zap, label: "Plays", value: plays, color: "text-brand-cyan" },
          { icon: Users, label: "Leads", value: leads, color: "text-success" },
          { icon: Activity, label: "Conv %", value: conv, suffix: "%", color: "text-warning" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              className="rounded-xl border border-border bg-card p-3 text-center"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
            >
              <Icon className={`size-4 mx-auto mb-1.5 ${stat.color}`} />
              <p className={`text-xl font-bold tabular-nums ${stat.color}`}>
                {stat.value.toLocaleString()}{stat.suffix ?? ""}
              </p>
              <p className="text-[9px] text-muted-foreground/55 mt-0.5">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        className="rounded-xl border border-border bg-card p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <p className="text-[9px] uppercase tracking-widest text-muted-foreground/50 mb-3">Plays over time</p>
        <svg viewBox="0 0 240 80" className="w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="tour-chart-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-brand-cyan)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--color-brand-cyan)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[20, 40, 60].map((y) => (
            <line key={y} x1="0" y1={y} x2="240" y2={y} stroke="rgba(255,255,255,0.04)" />
          ))}
          <motion.path
            d={`M0,${80 - CHART_POINTS[0] * 0.55} ${CHART_POINTS.map((p, i) => `L${(i / (CHART_POINTS.length - 1)) * 240},${80 - p * 0.55}`).join(" ")} L240,80 L0,80 Z`}
            fill="url(#tour-chart-fill)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          />
          <motion.path
            d={`M0,${80 - CHART_POINTS[0] * 0.55} ${CHART_POINTS.map((p, i) => `L${(i / (CHART_POINTS.length - 1)) * 240},${80 - p * 0.55}`).join(" ")}`}
            fill="none"
            stroke="var(--color-brand-cyan)"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
          />
          <motion.circle
            cx={240}
            cy={80 - CHART_POINTS[CHART_POINTS.length - 1] * 0.55}
            r="4"
            fill="var(--color-brand-cyan)"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.5, 1] }}
            transition={{ delay: 2.5, duration: 1.5, repeat: Infinity }}
          />
        </svg>
      </motion.div>
    </div>
  );
}
