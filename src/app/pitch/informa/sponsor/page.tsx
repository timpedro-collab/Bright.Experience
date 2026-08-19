/**
 * The sponsor-facing deck — what an Informa rep screens with an exhibitor.
 * Templated per show via `?show=&dates=&attendees=&days=` (Connect
 * Marketplace defaults). Unlisted like the rest of /pitch: noindex, no
 * organizer economics anywhere in the deck.
 */
import type { Metadata } from "next";
import { Suspense } from "react";

import { SponsorDeck } from "@/components/informa/SponsorDeck";

export const metadata: Metadata = {
  title: "Your brand on the show floor · Bright.Blue",
  robots: { index: false, follow: false },
};

export default function InformaSponsorDeckPage() {
  return (
    <Suspense>
      <SponsorDeck />
    </Suspense>
  );
}
