import type { TourConfig } from "./types";

export const partnerTour: TourConfig = {
  welcomeTitle: "Welcome to your partner hub.",
  welcomeSubtitle:
    "Track referrals, manage clients, and watch your commissions grow — all from one dashboard.",
  celebrationTitle: "Your partner hub is ready.",
  celebrationSubtitle: "Let's grow together.",
  celebrationCta: "Go to my dashboard",
  celebrationHref: "/",
  steps: [
    {
      target: null,
      visual: "partner-referral",
      title: "Your referral link",
      description:
        "Share your unique link with prospects. Every booking that comes through gets attributed to you. Copy it and start sharing.",
    },
    {
      target: null,
      visual: "event-glance",
      title: "Your clients",
      description:
        "See everyone you've referred — their events, their status, and their success. Track the full journey from referral to delivery.",
    },
    {
      target: null,
      visual: "partner-earnings",
      title: "Your earnings",
      description:
        "Commission tracking, payout history, and revenue projections. Watch your commissions grow month over month.",
    },
    {
      target: null,
      visual: "notifications",
      title: "Stay informed",
      description:
        "New referral conversions, commission updates, and client milestones — delivered in real time.",
    },
    {
      target: null,
      visual: "command-search",
      title: "Navigate quickly",
      description:
        "⌘K to search for clients, quotes, or jump to any section instantly.",
    },
  ],
};

export const venueTour: TourConfig = {
  welcomeTitle: "Welcome to your venue command centre.",
  welcomeSubtitle:
    "Placements, sponsorships, and packages — manage your venue's Bright.Blue footprint from here.",
  celebrationTitle: "Your venue is connected.",
  celebrationSubtitle: "Time to fill those slots.",
  celebrationCta: "Go to my dashboard",
  celebrationHref: "/",
  steps: [
    {
      target: null,
      visual: "logistics-timeline",
      title: "Machine placements",
      description:
        "See where every machine sits in your venue and manage the placement runway.",
    },
    {
      target: null,
      visual: "event-glance",
      title: "Sponsorship slots",
      description:
        "Brand sponsors for your machines — track availability, pricing, and bookings.",
    },
    {
      target: null,
      visual: "partner-earnings",
      title: "Venue packages",
      description:
        "Bundle placements and sponsorships into packages for easy selling.",
    },
    {
      target: null,
      visual: "notifications",
      title: "Venue updates",
      description:
        "New sponsorship enquiries, placement changes, and booking confirmations.",
    },
  ],
};
