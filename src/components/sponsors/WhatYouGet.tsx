/**
 * What buying this slot actually includes.
 *
 * A sponsorship line on a rate card ("branded vending unit — £X") is the one
 * thing a prospect can't price against anything else, so the question that
 * stalls the sale is always "what do I get for that?". Every line here is a
 * capability the platform genuinely ships: the branded game and landing page,
 * business-email-only GDPR capture, the live dashboard, and the report at the
 * end. Nothing aspirational belongs in this list.
 */

import { Check } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

/** One inclusion: what it is, and the detail that makes it credible. */
export interface Inclusion {
  title: string;
  detail: string;
}

/**
 * The standard slot inclusions. Held here rather than in the page so the
 * organizer's rate card and the sponsor's pitch can never drift apart.
 */
const SLOT_INCLUSIONS: Inclusion[] = [
  {
    title: "The machine, wrapped as yours",
    detail:
      "Full-height branded wrap and screen artwork. Send your own or have our studio produce it.",
  },
  {
    title: "A game built around your goal",
    detail:
      "Chosen and configured with you, then tested before the doors open. Prizes are yours or ours.",
  },
  {
    title: "Leads captured cleanly",
    detail:
      "Business email addresses only, duplicates blocked, consent recorded on every entry.",
  },
  {
    title: "A live link during the show",
    detail:
      "Plays, leads and stock on your phone as they happen. No status calls, no waiting.",
  },
  {
    title: "Your data and a report after",
    detail:
      "Every consented contact, plus the numbers behind the activation, within days of collection.",
  },
  {
    title: "We run it",
    detail:
      "Delivery, install, restocking through the show and collection are ours, not the venue's.",
  },
];

interface WhatYouGetProps {
  items?: Inclusion[];
  title?: string;
}

export function WhatYouGet({
  items = SLOT_INCLUSIONS,
  title = "What's included",
}: WhatYouGetProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-heading text-sm font-semibold text-foreground">
          {title}
        </p>
        <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.title} className="flex items-start gap-2.5">
              <Check size={14} className="mt-0.5 shrink-0 text-success" />
              <div>
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.detail}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
