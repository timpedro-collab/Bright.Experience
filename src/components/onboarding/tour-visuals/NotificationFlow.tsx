"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCircle2, FileText, MessageSquare, Sparkles } from "lucide-react";

const NOTIFICATIONS = [
  {
    id: 1,
    icon: CheckCircle2,
    iconColor: "text-emerald-400",
    title: "Creative proof approved",
    body: "Your team signed off on the screen designs",
    time: "Just now",
  },
  {
    id: 2,
    icon: FileText,
    iconColor: "text-[var(--color-bb-cyan)]",
    title: "New report available",
    body: "Post-event performance report is ready to view",
    time: "2m ago",
  },
  {
    id: 3,
    icon: MessageSquare,
    iconColor: "text-blue-400",
    title: "Message from your Account Manager",
    body: "Quick update on the logistics timeline",
    time: "5m ago",
  },
];

export function NotificationFlow() {
  const [visible, setVisible] = useState<number[]>([]);

  useEffect(() => {
    const timers = [
      setTimeout(() => setVisible([1]), 800),
      setTimeout(() => setVisible([1, 2]), 1800),
      setTimeout(() => setVisible([1, 2, 3]), 2800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-5">
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
      >
        <div className="flex items-center justify-center size-14 rounded-2xl border border-white/10 bg-white/[0.04]">
          <Bell className="size-6 text-white/60" />
        </div>
        <AnimatePresence>
          {visible.length > 0 && (
            <motion.span
              className="absolute -top-1.5 -right-1.5 flex items-center justify-center size-5 rounded-full bg-[var(--color-bb-cyan)] text-[10px] font-bold text-[var(--color-bb-deep-ink)]"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500 }}
              key={visible.length}
            >
              {visible.length}
            </motion.span>
          )}
        </AnimatePresence>
        {visible.length > 0 && (
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-[var(--color-bb-cyan)]"
            initial={{ opacity: 0.6, scale: 1 }}
            animate={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 1, repeat: 2, repeatDelay: 0.5 }}
          />
        )}
      </motion.div>

      <div className="w-full space-y-2">
        <AnimatePresence>
          {NOTIFICATIONS.filter((n) => visible.includes(n.id)).map((n, i) => {
            const Icon = n.icon;
            return (
              <motion.div
                key={n.id}
                className="flex items-start gap-3 p-3.5 rounded-xl border border-white/8 bg-white/[0.03]"
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 24,
                  delay: i * 0.05,
                }}
              >
                <div className="flex items-center justify-center size-8 rounded-lg bg-white/[0.04] shrink-0 mt-0.5">
                  <Icon className={`size-4 ${n.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white/90 truncate">{n.title}</p>
                  <p className="text-[11px] text-white/40 mt-0.5 truncate">{n.body}</p>
                </div>
                <span className="text-[9px] text-white/25 shrink-0 mt-0.5">{n.time}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <motion.div
        className="flex items-center gap-1.5 text-[10px] text-white/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.2 }}
      >
        <Sparkles className="size-3" />
        <span>Real-time updates · never miss a beat</span>
      </motion.div>
    </div>
  );
}
