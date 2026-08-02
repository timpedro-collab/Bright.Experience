/** Shared utility functions for venue pages. */

/** ONE status vocabulary for the venue portal (placements + slots). */
export type VenueBadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "info"
  | "muted";

export function venueStatusVariant(status: string): VenueBadgeVariant {
  switch (status) {
    case "active":
      return "success";
    case "reserved":
      return "info";
    case "available":
      return "warning";
    case "planned":
      return "default";
    case "completed":
    case "cancelled":
    default:
      return "muted";
  }
}

export function venueStatusLabel(status: string): string {
  if (!status) return "—";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/** Token-based fill for timeline bars, matching the badge variant palette. */
export function venueStatusBarClass(status: string): string {
  switch (venueStatusVariant(status)) {
    case "success":
      return "bg-success/40";
    case "info":
      return "bg-info/40";
    case "warning":
      return "bg-warning/40";
    case "default":
      return "bg-primary/40";
    default:
      return "bg-muted-foreground/25";
  }
}

interface SlotLike {
  status: string;
  price?: number | null;
  [key: string]: unknown;
}

export interface SlotEconomics {
  total: number;
  /** Held (reserved) + confirmed (active) slots — committed inventory. */
  booked: number;
  reserved: number;
  /** Confirmed & paid (active) slots. */
  confirmed: number;
  available: number;
  /** Booked (reserved + active) slot value in integer cents. */
  bookedCents: number;
  /** Confirmed (active) slot value in integer cents — locked-in revenue. */
  confirmedCents: number;
  /** Available slot value in integer cents — money still on the table. */
  openCents: number;
  /** Booked ÷ total, 0–100. */
  fillRate: number;
}

/** Roll up slot counts and money so the venue can see revenue, not just rows. */
export function summariseSlots(slots: SlotLike[]): SlotEconomics {
  let bookedCents = 0;
  let confirmedCents = 0;
  let openCents = 0;
  let reserved = 0;
  let confirmed = 0;
  let available = 0;
  for (const s of slots) {
    const price = Number(s.price) || 0;
    if (s.status === "reserved") {
      reserved += 1;
      bookedCents += price;
    } else if (s.status === "active") {
      confirmed += 1;
      bookedCents += price;
      confirmedCents += price;
    } else if (s.status === "available") {
      available += 1;
      openCents += price;
    }
  }
  const total = slots.length;
  const booked = reserved + confirmed;
  const fillRate = total > 0 ? Math.round((booked / total) * 100) : 0;
  return {
    total,
    booked,
    reserved,
    confirmed,
    available,
    bookedCents,
    confirmedCents,
    openCents,
    fillRate,
  };
}

