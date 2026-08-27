/**
 * Buyer, mission, proof, and timeline copy for the confidential Bright.Blue
 * 2027–2029 commercial-plan deck. Forecast arithmetic lives in `forecast.ts`.
 */

export const COMMERCIAL_COVER = {
  overline: "Confidential · Internal commercial plan",
  title: "Bright.Blue",
  accent: "2027–2029.",
  subtitle:
    "The mission, offer, routes to market, channel economics and three-year revenue plan.",
  cta: "Open the plan",
} as const;

export const COMMERCIAL_MISSION = {
  overline: "Mission",
  headline:
    "Turn event footfall into measurable attention, opted-in demand and repeatable media revenue.",
  pillars: [
    {
      title: "Make the physical moment perform",
      line: "Give every attendee a reason to stop, play and remember the brand.",
    },
    {
      title: "Make the outcome defensible",
      line: "Connect each play to consented data and evidence the buyer can take to the board.",
    },
    {
      title: "Make the format repeatable",
      line: "Package machines, media and reporting so channels can sell the same product again.",
    },
  ],
} as const;

export const CUSTOMER_GOALS = {
  overline: "What the customer gets",
  headline: "Four jobs. One activation.",
  items: [
    {
      title: "Attention",
      metric: "Crowd",
      line: "A full-size branded object that changes the energy around a stand or floor.",
    },
    {
      title: "Participation",
      metric: "Play",
      line: "A fast, rewarding interaction with a clear reason to join the queue.",
    },
    {
      title: "Demand",
      metric: "Lead",
      line: "Opted-in contacts with declared preferences and context, not anonymous traffic.",
    },
    {
      title: "Proof",
      metric: "Renew",
      line: "Board-ready reporting that turns a successful event into the next booking.",
    },
  ],
} as const;

export const COMMERCIAL_PROOF = {
  overline: "Images and video",
  headline: "The product explains itself in the room.",
  video: {
    src: "/pitch/video/adyen-event-loop.mp4",
    poster: "/pitch/photos/adyen-play-queue.jpg",
    label: "Adyen · live event loop",
  },
  photos: [
    {
      src: "/pitch/photos/pepsi-midplay-crowd.jpg",
      alt: "Attendee playing a wrapped Pepsi machine while another attendee films",
      label: "Pepsi · participation",
    },
    {
      src: "/pitch/photos/pelion-expo-play.jpg",
      alt: "Attendee playing a fully wrapped machine on an expo floor",
      label: "Pelion · expo floor",
    },
    {
      src: "/pitch/photos/biba-leadenhall.jpg",
      alt: "Bright.Blue machine in a conference foyer",
      label: "BIBA · venue",
    },
  ],
} as const;

export const PRICING_SLIDE = {
  overline: "Pricing",
  headline: "A ladder buyers can enter and grow through.",
  note:
    "US 1–3 day activation bands. Working ranges pending owner sign-off; Bespoke covers tours, residencies and custom builds.",
} as const;

export const CHANNELS_SLIDE = {
  overline: "Sales channels",
  headline: "Four routes. One protected rate card.",
  note:
    "Direct establishes the price. Channels add reach. No route sells below the Showstopper floor.",
} as const;

export const CHANNEL_SPLIT_SLIDE = {
  overline: "Channel economics",
  headline: "What each route earns on the same $50k sale.",
  note:
    "Working planning model: organizer 70/30 is the current modeled split; agency and venue use documented midpoint assumptions pending owner sign-off.",
} as const;

export const FORECAST_SLIDE = {
  overline: "Bright.Blue business forecast",
  headline: "Base case: channel scale becomes the growth engine.",
  note:
    "Revenue forecast only. Excludes VAT, delivery cost, headcount, capex and EBITDA. Scenario volumes are planning assumptions, not contracted pipeline.",
} as const;

export const COMMERCIAL_TIMELINE = {
  overline: "Timeline",
  headline: "Prove. Scale. Compound.",
  years: [
    {
      year: "2027",
      phase: "Prove repeatability",
      target: "62 placements · $2.2m BB revenue",
      points: [
        "Validate the new price ladder on live enquiries",
        "Establish one repeatable route in each channel",
        "Ship dashboard and CRM integration milestones",
      ],
    },
    {
      year: "2028",
      phase: "Scale the channels",
      target: "146 placements · $5.2m BB revenue",
      points: [
        "Expand organizer programs across show portfolios",
        "Turn agencies and venues into recurring sellers",
        "Standardize capacity, reporting and renewal motions",
      ],
    },
    {
      year: "2029",
      phase: "Compound the network",
      target: "280 placements · $9.9m BB revenue",
      points: [
        "Make cross-show buying the default",
        "Use benchmark data to improve every renewal",
        "Shift growth from founder-led sales to channel-led scale",
      ],
    },
  ],
  footnote:
    "Gate each phase on close rate, delivery quality and contribution economics before adding volume.",
} as const;
