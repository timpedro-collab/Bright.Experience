"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Play, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useModalOverlay } from "@/hooks/useModalOverlay";

export interface MediaItem {
  url: string;
  type: "image" | "video";
  alt?: string;
  poster?: string;
}

interface MediaGalleryProps {
  items: MediaItem[];
  className?: string;
}

/** Screen-reader name for a thumbnail: the alt text is on the image, not the button. */
function openLabel(item: MediaItem, index: number, total: number): string {
  const kind = item.type === "video" ? "video" : "image";
  const subject = item.alt ? `${kind}: ${item.alt}` : `${kind} ${index + 1} of ${total}`;
  return `Open ${subject}`;
}

export function MediaGallery({ items, className }: MediaGalleryProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const open = useCallback((i: number) => setLightboxIdx(i), []);
  const close = useCallback(() => setLightboxIdx(null), []);
  const prev = useCallback(() => {
    setLightboxIdx((i) => (i !== null ? (i - 1 + items.length) % items.length : null));
  }, [items.length]);
  const next = useCallback(() => {
    setLightboxIdx((i) => (i !== null ? (i + 1) % items.length : null));
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <>
      <div className={cn("space-y-2", className)}>
        {items.length === 1 ? (
          <SingleItem item={items[0]} onClick={() => open(0)} label={openLabel(items[0], 0, 1)} />
        ) : items.length === 2 ? (
          <div className="grid grid-cols-2 gap-2">
            {items.map((item, i) => (
              <Tile
                key={i}
                item={item}
                onClick={() => open(i)}
                aspect="aspect-[4/3]"
                label={openLabel(item, i, items.length)}
              />
            ))}
          </div>
        ) : (
          <MasonryGrid items={items} onOpen={open} />
        )}
      </div>

      <AnimatePresence>
        {lightboxIdx !== null && (
          <Lightbox
            items={items}
            index={lightboxIdx}
            onClose={close}
            onPrev={prev}
            onNext={next}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function SingleItem({
  item, onClick, label,
}: {
  item: MediaItem; onClick: () => void; label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="group relative w-full overflow-hidden rounded-xl border border-white/8 cursor-zoom-in"
    >
      <div className="relative aspect-[16/9]">
        {item.type === "video" ? (
          <VideoThumbnail item={item} />
        ) : (
          <Image
            src={item.url}
            alt={item.alt ?? ""}
            fill
            sizes="(min-width: 768px) 70vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        )}
        <HoverOverlay />
      </div>
    </button>
  );
}

function MasonryGrid({ items, onOpen }: { items: MediaItem[]; onOpen: (i: number) => void }) {
  const [hero, ...rest] = items;
  return (
    <div className="grid gap-2 md:grid-cols-[1.6fr_1fr]">
      <Tile
        item={hero}
        onClick={() => onOpen(0)}
        aspect="aspect-[4/3] md:aspect-auto md:row-span-2 md:h-full"
        priority
        label={openLabel(hero, 0, items.length)}
      />
      <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
        {rest.slice(0, 3).map((item, i) => (
          <div key={i} className="relative">
            <Tile
              item={item}
              onClick={() => onOpen(i + 1)}
              aspect="aspect-[4/3]"
              label={openLabel(item, i + 1, items.length)}
            />
            {i === 2 && rest.length > 3 && (
              <button
                type="button"
                onClick={() => onOpen(3)}
                aria-label={`Show the remaining ${rest.length - 3} items`}
                className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 backdrop-blur-sm text-white font-semibold text-lg hover:bg-black/60 transition-colors"
              >
                +{rest.length - 3} more
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Tile({
  item, onClick, aspect, priority, label,
}: {
  item: MediaItem; onClick: () => void; aspect: string; priority?: boolean; label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn("group relative w-full overflow-hidden rounded-xl border border-white/8 cursor-zoom-in", aspect)}
    >
      {item.type === "video" ? (
        <VideoThumbnail item={item} />
      ) : (
        <Image
          src={item.url}
          alt={item.alt ?? ""}
          fill
          sizes="(min-width: 768px) 40vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          priority={priority}
        />
      )}
      <HoverOverlay />
    </button>
  );
}

function VideoThumbnail({ item }: { item: MediaItem }) {
  return (
    <>
      {item.poster ? (
        <Image src={item.poster} alt={item.alt ?? ""} fill className="object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-bb-deep-ink)] to-[var(--color-bb-cobalt)]" />
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-white/15 backdrop-blur-md border border-white/20">
          <Play className="size-6 text-white ml-0.5" fill="white" />
        </div>
      </div>
    </>
  );
}

function HoverOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors duration-300">
      <Maximize2 className="size-5 text-white opacity-0 group-hover:opacity-70 transition-opacity" />
    </div>
  );
}

function Lightbox({
  items, index, onClose, onPrev, onNext,
}: {
  items: MediaItem[]; index: number; onClose: () => void; onPrev: () => void; onNext: () => void;
}) {
  const item = items[index];
  const overlayRef = useModalOverlay<HTMLDivElement>({
    active: true,
    onClose,
    onPrev: items.length > 1 ? onPrev : undefined,
    onNext: items.length > 1 ? onNext : undefined,
  });

  return (
    <motion.div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={item.alt ? `Media viewer: ${item.alt}` : "Media viewer"}
      tabIndex={-1}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm outline-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Close media viewer"
        className="absolute top-4 right-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X className="size-5" aria-hidden="true" />
      </button>

      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            aria-label="Previous item"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            aria-label="Next item"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </>
      )}

      <p className="sr-only" aria-live="polite">
        {items.length > 1 ? `Item ${index + 1} of ${items.length}. ` : ""}
        Press Escape to close
        {items.length > 1 ? ", or the left and right arrow keys to move between items" : ""}.
      </p>

      <motion.div
        key={index}
        className="relative max-h-[85vh] max-w-[90vw]"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {item.type === "video" ? (
          <video
            src={item.url}
            poster={item.poster}
            controls
            autoPlay
            className="max-h-[85vh] rounded-lg"
          />
        ) : (
          <Image
            src={item.url}
            alt={item.alt ?? ""}
            width={1400}
            height={900}
            className="max-h-[85vh] w-auto rounded-lg object-contain"
          />
        )}
      </motion.div>

      {items.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5" aria-hidden="true">
          {items.map((_, i) => (
            <span
              key={i}
              className={cn(
                "size-1.5 rounded-full transition-all",
                i === index ? "bg-white w-4 rounded-full" : "bg-white/30",
              )}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
