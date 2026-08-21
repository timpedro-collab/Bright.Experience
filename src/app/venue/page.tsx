/**
 * Bright.Blue for venues — the 5-slide venue snapshot deck, pitched at
 * convention centers and expo venues that host trade shows: title, what
 * this is, proof collage, what a placement needs, and how the building
 * benefits.
 *
 * Unlisted rather than secret, like the /informa suite: noindex, no
 * internal economics (this deck is deliberately non-financial), distinct
 * OG metadata so shared links preview as their own document in WhatsApp
 * and iMessage. Public by path via the `/venue` entry in
 * `src/lib/auth/public-routes.ts`.
 */
import type { Metadata } from "next";
import { Suspense } from "react";

import { VenueSnapshotDeck } from "@/components/venue-pitch/VenueSnapshotDeck";

export const metadata: Metadata = {
  title: { absolute: "Bright.Blue for Venues — 5-Slide Overview" },
  description:
    "Sponsor-funded interactive machines for the shows your building hosts. Installed, operated and removed by Bright.Blue, at zero cost to the venue.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Bright.Blue for Venues — 5-Slide Overview",
    description:
      "Sponsor-funded interactive machines for the shows your building hosts. Installed, operated and removed by Bright.Blue, at zero cost to the venue.",
    images: [{ url: "/pitch/photos/biba-leadenhall.jpg", width: 2400, height: 1600 }],
    type: "website",
  },
};

export default function VenueSnapshotPage() {
  return (
    <Suspense>
      <VenueSnapshotDeck />
    </Suspense>
  );
}
