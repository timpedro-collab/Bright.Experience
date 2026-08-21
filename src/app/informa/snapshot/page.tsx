/**
 * Bright.Blue × Informa — the 5-slide snapshot deck. The forwardable,
 * minimal-text companion to the full partnership deck at /informa: title,
 * what this is, proof collage, the rate card, and what Informa makes.
 *
 * Unlisted rather than secret, like the rest of the /informa suite:
 * noindex, no internal economics (retail bands and the headline split
 * only), distinct OG metadata so shared links preview as their own
 * document in WhatsApp and iMessage.
 */
import type { Metadata } from "next";
import { Suspense } from "react";

import { InformaSnapshotDeck } from "@/components/informa/InformaSnapshotDeck";

export const metadata: Metadata = {
  title: { absolute: "Informa × Bright.Blue — 5-Slide Snapshot" },
  description:
    "The whole story in five slides: sponsor-funded machines, the proof, the five-product rate card, and what Informa makes.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Informa × Bright.Blue — 5-Slide Snapshot",
    description:
      "The whole story in five slides: sponsor-funded machines, the proof, the five-product rate card, and what Informa makes.",
    images: [{ url: "/pitch/photos/pepsi-midplay-crowd.jpg", width: 2400, height: 1600 }],
    type: "website",
  },
};

export default function InformaSnapshotPage() {
  return (
    <Suspense>
      <InformaSnapshotDeck />
    </Suspense>
  );
}
