/**
 * The Informa snapshot deck: five minimal-text slides on the shared deck
 * shell. The forwardable companion to the full partnership deck at
 * `/informa` — same facts, one-tenth the words.
 */
"use client";

import { DeckShell, type DeckShellSlide } from "@/components/decks/DeckShell";
import {
  SnapshotCoverSlide,
  SnapshotPackagesSlide,
  SnapshotProofSlide,
  SnapshotValueSlide,
  SnapshotWhatSlide,
} from "./snapshot-slides";

const SLIDES: DeckShellSlide[] = [
  { id: "cover", Component: SnapshotCoverSlide },
  { id: "what", Component: SnapshotWhatSlide },
  { id: "proof", Component: SnapshotProofSlide },
  { id: "packages", Component: SnapshotPackagesSlide },
  { id: "value", Component: SnapshotValueSlide },
];

export function InformaSnapshotDeck() {
  return <DeckShell slides={SLIDES} />;
}
