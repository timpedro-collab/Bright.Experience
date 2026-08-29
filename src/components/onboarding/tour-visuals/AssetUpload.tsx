"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Image, FileText, Check } from "lucide-react";

const FILES = [
  { id: 1, name: "brand-guidelines.pdf", icon: FileText, size: "2.4 MB" },
  { id: 2, name: "hero-image-01.png", icon: Image, size: "4.1 MB" },
  { id: 3, name: "screen-design-v3.png", icon: Image, size: "3.8 MB" },
];

export function AssetUpload() {
  const [uploaded, setUploaded] = useState<number[]>([]);
  const [progress, setProgress] = useState<Record<number, number>>({});

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    FILES.forEach((f, i) => {
      const baseDelay = 800 + i * 1200;
      for (let p = 0; p <= 100; p += 20) {
        timers.push(
          setTimeout(() => {
            setProgress((prev) => ({ ...prev, [f.id]: p }));
          }, baseDelay + (p / 100) * 600)
        );
      }
      timers.push(setTimeout(() => setUploaded((prev) => [...prev, f.id]), baseDelay + 800));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="w-full max-w-sm mx-auto space-y-4">
      <motion.div
        className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-input bg-card/50 py-6 px-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        >
          <Upload className="size-6 text-brand-cyan/60" />
        </motion.div>
        <p className="text-xs text-muted-foreground/60">Drag files or click to upload</p>
      </motion.div>

      <div className="space-y-2">
        <AnimatePresence>
          {FILES.map((f, i) => {
            const Icon = f.icon;
            const isDone = uploaded.includes(f.id);
            const prog = progress[f.id] ?? 0;
            return (
              <motion.div
                key={f.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                transition={{ delay: 0.6 + i * 1.2, type: "spring", stiffness: 200 }}
              >
                <div className="flex items-center justify-center size-9 rounded-lg bg-secondary shrink-0">
                  <Icon className="size-4 text-brand-cyan" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground/85 truncate">{f.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        animate={{ width: `${isDone ? 100 : prog}%` }}
                        transition={{ type: "spring", stiffness: 100 }}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground/50 tabular-nums shrink-0">{f.size}</span>
                  </div>
                </div>
                <AnimatePresence mode="wait">
                  {isDone && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      <Check className="size-4 text-success" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
