/**
 * The venue snapshot deck: five minimal-text slides on the shared deck
 * shell, pitched at convention centers and expo venues that host trade
 * shows. Non-financial posture throughout — see `@/lib/venue-pitch/content`.
 */
"use client";

import { DeckShell, type DeckShellSlide } from "@/components/decks/DeckShell";
import {
  VenueBenefitsSlide,
  VenueCoverSlide,
  VenueNeedsSlide,
  VenueProofSlide,
  VenueWhatSlide,
} from "./venue-slides";

const SLIDES: DeckShellSlide[] = [
  { id: "cover", Component: VenueCoverSlide },
  { id: "what", Component: VenueWhatSlide },
  { id: "proof", Component: VenueProofSlide },
  { id: "needs", Component: VenueNeedsSlide },
  { id: "benefits", Component: VenueBenefitsSlide },
];

export function VenueSnapshotDeck() {
  return <DeckShell slides={SLIDES} />;
}
