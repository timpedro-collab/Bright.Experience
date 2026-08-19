/**
 * Bright.Blue × Informa partnership deck — a chromeless, fullscreen slide
 * experience for presenting the Informa partnership live.
 *
 * Unlisted rather than secret: noindex, outside the (public) route group so
 * marketing chrome never wraps it, and it carries no internal economics
 * (see `@/lib/informa/content` and the buyer-safe rule it documents).
 *
 * Every page in the /informa suite carries distinct titles, descriptions
 * and OG images so shared links (WhatsApp, iMessage, Slack) preview as
 * clearly different documents.
 */
import type { Metadata } from "next";
import { Suspense } from "react";

import { InformaPitchDeck } from "@/components/informa/InformaPitchDeck";

export const metadata: Metadata = {
  title: { absolute: "Informa × Bright.Blue — Partnership Deck" },
  description:
    "New inventory for the shows you already run: the Tampa showcase, the four-product family, and the proof behind it.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Informa × Bright.Blue — Partnership Deck",
    description:
      "New inventory for the shows you already run: the Tampa showcase, the four-product family, and the proof behind it.",
    images: [{ url: "/pitch/photos/adyen-play-queue.jpg", width: 2400, height: 1600 }],
    type: "website",
  },
};

export default function InformaPitchPage() {
  return (
    <Suspense>
      <InformaPitchDeck />
    </Suspense>
  );
}
