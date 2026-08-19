/**
 * The delivery half of the seller's kit: what happens after the signature
 * (timeline), what the show must provision (site requirements), and real
 * activation photography. All copy comes from `@/lib/informa/content`.
 */
import Image from "next/image";

import {
  DELIVERY_TIMELINE,
  KIT_GALLERY,
  SITE_REQUIREMENTS,
} from "@/lib/informa/content";

export function DeliveryTimeline() {
  return (
    <ol className="relative space-y-0 border-l border-border/70 pl-8">
      {DELIVERY_TIMELINE.map((phase, i) => (
        <li key={phase.phase} className="relative pb-8 last:pb-0">
          <span
            aria-hidden
            className="absolute -left-8 top-1 flex size-8 -translate-x-1/2 items-center justify-center rounded-full border border-[var(--color-bb-cobalt)]/60 bg-background text-xs font-bold text-[var(--color-bb-cyan)]"
          >
            {i + 1}
          </span>
          <h3 className="font-semibold">{phase.phase}</h3>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {phase.detail}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function SiteRequirements() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {SITE_REQUIREMENTS.map((req) => (
        <div key={req.need} className="rounded-2xl border border-border/70 bg-card/50 p-5">
          <h3 className="text-sm font-semibold text-[var(--color-bb-cyan)]">{req.need}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{req.detail}</p>
        </div>
      ))}
    </div>
  );
}

export function KitGallery() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {KIT_GALLERY.map((photo) => (
        <div
          key={photo.src}
          className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-border/70"
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(max-width: 1024px) 50vw, 25vw"
            className="object-cover"
            style={{ objectPosition: photo.position }}
          />
        </div>
      ))}
    </div>
  );
}
