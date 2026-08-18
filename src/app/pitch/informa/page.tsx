/**
 * Bright.Blue × Informa pitch deck — a chromeless, fullscreen slide
 * experience for presenting the Informa partnership live.
 *
 * Unlisted rather than secret: noindex, outside the (public) route group so
 * marketing chrome never wraps it, and it carries no internal economics
 * (see `@/lib/informa/content` and the buyer-safe rule it documents).
 */
import type { Metadata } from "next";
import { Suspense } from "react";

import { InformaPitchDeck } from "@/components/informa/InformaPitchDeck";

export const metadata: Metadata = {
  title: "Bright.Blue × Informa",
  robots: { index: false, follow: false },
};

export default function InformaPitchPage() {
  return (
    <Suspense>
      <InformaPitchDeck />
    </Suspense>
  );
}
