/**
 * The sponsor-facing deck — what an Informa rep screens with an exhibitor.
 * Templated per show via `?show=&dates=&attendees=&days=` (Connect
 * Marketplace defaults). Unlisted like the rest of /informa: noindex, no
 * organizer economics anywhere in the deck.
 */
import type { Metadata } from "next";
import { Suspense } from "react";

import { SponsorDeck } from "@/components/informa/SponsorDeck";

export const metadata: Metadata = {
  title: { absolute: "Sponsor Deck — Your Brand on the Show Floor" },
  description:
    "What a badge-gated Bright.Blue machine does for a sponsor at the show: the crowd, the play, the leads and the 24-hour report.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Sponsor Deck — Your Brand on the Show Floor",
    description:
      "What a badge-gated Bright.Blue machine does for a sponsor at the show: the crowd, the play, the leads and the 24-hour report.",
    images: [{ url: "/pitch/photos/pepsi-tap-play.jpg", width: 2000, height: 1333 }],
    type: "website",
  },
};

export default function InformaSponsorDeckPage() {
  return (
    <Suspense>
      <SponsorDeck />
    </Suspense>
  );
}
