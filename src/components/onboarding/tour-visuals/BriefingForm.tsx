"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Pencil } from "lucide-react";

const FIELDS = [
  { label: "Brand name", value: "Costa Coffee", delay: 0 },
  { label: "Campaign", value: "Catch-A-Matcha", delay: 0.8 },
  { label: "Audience", value: "18–35 urban professionals", delay: 1.6 },
  { label: "Objective", value: "Drive trial of new Matcha range", delay: 2.4 },
];

function TypeWriter({ text, delay }: { text: string; delay: number }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i <= text.length; i++) {
      timers.push(setTimeout(() => setShown(i), delay * 1000 + i * 40));
    }
    return () => timers.forEach(clearTimeout);
  }, [text, delay]);

  return (
    <span>
      {text.slice(0, shown)}
      {shown < text.length && (
        <motion.span
          className="inline-block w-[2px] h-3.5 bg-brand-cyan ml-px align-middle"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
        />
      )}
    </span>
  );
}

export function BriefingForm() {
  return (
    <div className="w-full max-w-sm mx-auto">
      <motion.div
        className="rounded-2xl border border-border bg-card overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      >
        <div className="px-5 py-3.5 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pencil className="size-3.5 text-brand-cyan" />
            <span className="text-xs font-semibold text-foreground/85">Event briefing</span>
          </div>
          <span className="text-[9px] text-muted-foreground/40">Auto-saved</span>
        </div>

        <div className="p-5 space-y-4">
          {FIELDS.map((field) => (
            <motion.div
              key={field.label}
              className="space-y-1.5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: field.delay * 0.4 + 0.3 }}
            >
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground/55">
                {field.label}
              </label>
              <div className="rounded-lg border border-input bg-background/50 px-3 py-2">
                <span className="text-sm text-foreground/85">
                  <TypeWriter text={field.value} delay={field.delay * 0.4 + 0.6} />
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="px-5 py-3 border-t border-border/50 flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.5 }}
        >
          {/* Primary CTA carries the brand gradient — the card's one accent. */}
          <motion.button
            className="chip-brand-gradient px-4 py-1.5 rounded-lg text-xs font-medium"
            whileHover={{ scale: 1.02 }}
          >
            Save & continue
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}
