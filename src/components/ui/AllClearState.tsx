"use client";

import { motion } from "framer-motion";
import { PartyPopper, CheckCircle2, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "tasks" | "qa" | "waiting";

const COPY: Record<Variant, { icon: React.ElementType; title: string; sub: string }> = {
  tasks: {
    icon: CheckCircle2,
    title: "All tasks complete",
    sub: "Nothing waiting on you. Enjoy the clear runway.",
  },
  qa: {
    icon: PartyPopper,
    title: "QA fully passed",
    sub: "Every check passed. The build is clean.",
  },
  waiting: {
    icon: Coffee,
    title: "Queue empty",
    sub: "Nothing needs your attention right now. Your team will reach out when they need you.",
  },
};

interface AllClearStateProps {
  variant: Variant;
  className?: string;
}

export function AllClearState({ variant, className }: AllClearStateProps) {
  const { icon: Icon, title, sub } = COPY[variant];

  return (
    <motion.div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6",
        className
      )}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.div
        className="flex items-center justify-center size-16 rounded-2xl border border-white/10 bg-white/[0.03] mb-6"
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
      >
        <Icon className="size-8 text-[var(--color-bb-cyan)]" />
      </motion.div>

      <motion.p
        className="text-lg font-semibold text-foreground"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {title}
      </motion.p>
      <motion.p
        className="mt-2 text-sm text-muted-foreground max-w-[32ch]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        {sub}
      </motion.p>

      <motion.div
        className="mt-6 flex gap-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="inline-block size-1 rounded-full bg-[var(--color-bb-cyan)]/40"
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
