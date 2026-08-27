/**
 * Confidential nine-slide Bright.Blue 2027–2029 commercial-plan deck,
 * rendered on the shared fullscreen deck shell.
 */
"use client";

import { DeckShell, type DeckShellSlide } from "@/components/decks/DeckShell";
import {
  CommercialCoverSlide,
  CommercialMissionSlide,
  CommercialProofSlide,
  CustomerGoalsSlide,
} from "./commercial-slides-foundation";
import {
  BusinessForecastSlide,
  ChannelEconomicsSlide,
  CommercialPricingSlide,
  SalesChannelsSlide,
} from "./commercial-slides-economics";
import { CommercialTimelineSlide } from "./commercial-slides-timeline";

const SLIDES: DeckShellSlide[] = [
  { id: "title", Component: CommercialCoverSlide },
  { id: "mission", Component: CommercialMissionSlide },
  { id: "customer-goals", Component: CustomerGoalsSlide },
  { id: "proof", Component: CommercialProofSlide },
  { id: "pricing", Component: CommercialPricingSlide },
  { id: "channels", Component: SalesChannelsSlide },
  { id: "channel-economics", Component: ChannelEconomicsSlide },
  { id: "forecast", Component: BusinessForecastSlide },
  { id: "timeline", Component: CommercialTimelineSlide },
];

/** Render the confidential internal commercial-plan presentation. */
export function CommercialPlanDeck() {
  return <DeckShell slides={SLIDES} />;
}
