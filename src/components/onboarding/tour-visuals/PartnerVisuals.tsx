"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link2, Copy, TrendingUp, DollarSign } from "lucide-react";

export function PartnerReferral() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setCopied(true), 2000);
    const t2 = setTimeout(() => setCopied(false), 3500);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="w-full max-w-sm mx-auto space-y-4">
      <motion.div
        className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Link2 className="size-4 text-[var(--color-bb-cyan)]" />
          <span className="text-xs font-semibold text-white/80">Your referral link</span>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2.5">
          <span className="flex-1 text-xs text-white/50 truncate font-mono">
            bright.blue/ref/your-partner-code
          </span>
          <motion.button
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.05] text-[10px] text-white/50"
            animate={copied ? { scale: [1, 1.1, 1], backgroundColor: "rgba(0,212,255,0.15)" } : {}}
          >
            <Copy className="size-3" />
            {copied ? "Copied!" : "Copy"}
          </motion.button>
        </div>

        <motion.p
          className="text-[10px] text-white/25 mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Share this link — every booking gets attributed to you
        </motion.p>
      </motion.div>

      <motion.div
        className="grid grid-cols-2 gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        {[
          { label: "Referrals", value: "12", sub: "This quarter" },
          { label: "Converted", value: "8", sub: "67% rate" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="rounded-xl border border-white/8 bg-white/[0.03] p-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 + i * 0.15 }}
          >
            <p className="text-[9px] text-white/35">{stat.label}</p>
            <p className="text-lg font-bold text-white tabular-nums">{stat.value}</p>
            <p className="text-[9px] text-white/25">{stat.sub}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

export function PartnerEarnings() {
  const earnings = [
    { month: "Jan", amount: 1200 },
    { month: "Feb", amount: 1800 },
    { month: "Mar", amount: 2400 },
    { month: "Apr", amount: 1900 },
    { month: "May", amount: 3200 },
  ];
  const max = Math.max(...earnings.map((e) => e.amount));

  return (
    <div className="w-full max-w-sm mx-auto">
      <motion.div
        className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="size-4 text-emerald-400" />
            <span className="text-xs font-semibold text-white/80">Commission earnings</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400">
            <TrendingUp className="size-3" />
            <span className="text-[9px] font-medium">+24%</span>
          </div>
        </div>

        <div className="flex items-end gap-2 h-24">
          {earnings.map((e, i) => (
            <motion.div
              key={e.month}
              className="flex-1 flex flex-col items-center gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 + i * 0.15 }}
            >
              <motion.div
                className="w-full rounded-t-md bg-[var(--color-bb-cyan)]/40"
                initial={{ height: 0 }}
                animate={{ height: `${(e.amount / max) * 80}px` }}
                transition={{ delay: 0.8 + i * 0.15, type: "spring", stiffness: 100 }}
              />
              <span className="text-[8px] text-white/30">{e.month}</span>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          <span className="text-[10px] text-white/35">Total earned (YTD)</span>
          <span className="text-sm font-bold text-emerald-400 tabular-nums">$10,500</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
