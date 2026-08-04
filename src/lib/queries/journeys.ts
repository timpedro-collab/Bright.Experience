/** Read queries for post-play journeys and their touch funnels. */
import { createClient } from "@/lib/supabase/server";
import { logQueryError } from "@/lib/observability/log-query-error";
import type { JourneyKind } from "@/lib/validations/journeys";

export interface PostPlayJourney {
  id: string;
  eventId: string;
  kind: JourneyKind;
  headline: string;
  body: string | null;
  ctaLabel: string;
  ctaUrl: string;
  discountCode: string | null;
  isActive: boolean;
}

export interface JourneyFunnel {
  sent: number;
  opened: number;
  clicked: number;
  redeemed: number;
  /** Touches recorded within 24h of the first send — the "next morning" story. */
  within24h: { opened: number; clicked: number };
}

/** The event's journey (one per event by convention), or null when unconfigured. */
export async function getJourneyForEvent(
  eventId: string,
): Promise<PostPlayJourney | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("post_play_journeys")
    .select(
      "id, event_id, kind, headline, body, cta_label, cta_url, discount_code, is_active",
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logQueryError("getJourneyForEvent", error, { eventId });
    return null;
  }
  if (!data) return null;

  return {
    id: data.id,
    eventId: data.event_id,
    kind: data.kind as JourneyKind,
    headline: data.headline,
    body: data.body,
    ctaLabel: data.cta_label,
    ctaUrl: data.cta_url,
    discountCode: data.discount_code,
    isActive: data.is_active,
  };
}

const EMPTY_FUNNEL: JourneyFunnel = {
  sent: 0,
  opened: 0,
  clicked: 0,
  redeemed: 0,
  within24h: { opened: 0, clicked: 0 },
};

/** Funnel counts for a journey. Each lead counts once per touch by construction. */
export async function getJourneyFunnel(
  journeyId: string,
): Promise<JourneyFunnel> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journey_touches")
    .select("touch, occurred_at")
    .eq("journey_id", journeyId)
    .limit(10_000);

  if (error) {
    logQueryError("getJourneyFunnel", error, { journeyId });
    return EMPTY_FUNNEL;
  }
  const rows = data ?? [];
  if (rows.length === 0) return EMPTY_FUNNEL;

  const firstSent = rows
    .filter((r) => r.touch === "sent")
    .map((r) => new Date(r.occurred_at).getTime())
    .reduce((min, t) => Math.min(min, t), Number.POSITIVE_INFINITY);
  const dayCutoff = firstSent + 24 * 60 * 60 * 1000;

  const funnel: JourneyFunnel = {
    ...EMPTY_FUNNEL,
    within24h: { opened: 0, clicked: 0 },
  };
  const COUNTED = ["sent", "opened", "clicked", "redeemed"] as const;
  for (const row of rows) {
    const touch = COUNTED.find((t) => t === row.touch);
    if (touch) funnel[touch] += 1;
    if (
      (row.touch === "opened" || row.touch === "clicked") &&
      new Date(row.occurred_at).getTime() <= dayCutoff
    ) {
      funnel.within24h[row.touch as "opened" | "clicked"] += 1;
    }
  }
  return funnel;
}
