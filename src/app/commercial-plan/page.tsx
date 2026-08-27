/**
 * Confidential internal Bright.Blue 2027–2029 commercial-plan deck. The route
 * is intentionally absent from the public allowlist, so middleware requires
 * an authenticated session; InternalShell leaves it full-screen.
 */
import type { Metadata } from "next";
import { Suspense } from "react";

import { CommercialPlanDeck } from "@/components/commercial-plan/CommercialPlanDeck";

export const metadata: Metadata = {
  title: { absolute: "Bright.Blue 2027–2029 — Confidential Commercial Plan" },
  description:
    "Internal mission, offer, pricing, sales channels, channel economics, revenue forecast and timeline.",
  robots: { index: false, follow: false },
};

export default function CommercialPlanPage() {
  return (
    <Suspense>
      <CommercialPlanDeck />
    </Suspense>
  );
}
