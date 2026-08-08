/**
 * Narrow service-role read behind the public player result card.
 *
 * The lead id is the capability (unguessable UUID, like the booking
 * receipt): the page shows the player's own first name, their score, and
 * aggregate day context — never another player's contact details.
 */
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { logQueryError } from "@/lib/observability/log-query-error";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface PlayerResultData {
  firstNameSource: string | null;
  eventId: string;
  eventName: string;
  capturedAt: string;
  /** The player's own score when the machine recorded one. */
  score: number | null;
  /** Every scored play at the event on the player's day. */
  dayScores: number[];
  /** Total plays at the event on the player's day (scored or not). */
  dayPlays: number;
}

export async function getPlayerResult(
  leadId: string
): Promise<PlayerResultData | null> {
  if (!UUID_RE.test(leadId)) return null;
  const supabase = getServiceRoleClient();

  const { data: lead, error } = await supabase
    .from("leads")
    .select("id, event_id, contact_name, custom_fields_json, captured_at")
    .eq("id", leadId)
    .maybeSingle();

  if (error || !lead) {
    if (error) logQueryError("getPlayerResult", error, { leadId });
    return null;
  }

  const eventId = String(lead.event_id);
  const capturedAt = String(lead.captured_at);
  const day = capturedAt.slice(0, 10);

  const [{ data: event }, { data: plays }] = await Promise.all([
    supabase.from("events").select("name").eq("id", eventId).maybeSingle(),
    supabase
      .from("telemetry_events")
      .select("event_type, payload_json")
      .eq("event_id", eventId)
      .in("event_type", ["play_completed", "game_completed"])
      .gte("timestamp", `${day}T00:00:00.000Z`)
      .lte("timestamp", `${day}T23:59:59.999Z`)
      .limit(2000),
  ]);

  const dayScores: number[] = [];
  for (const row of (plays ?? []) as Record<string, unknown>[]) {
    const payload = (row.payload_json ?? {}) as Record<string, unknown>;
    const score = Number(payload.score);
    if (Number.isFinite(score)) dayScores.push(score);
  }

  const custom = (lead.custom_fields_json ?? {}) as Record<string, unknown>;
  const ownScore = Number(custom.score);

  return {
    firstNameSource: (lead.contact_name as string | null) ?? null,
    eventId,
    eventName: event?.name ? String(event.name) : "a Bright.Blue activation",
    capturedAt,
    score: Number.isFinite(ownScore) ? ownScore : null,
    dayScores,
    dayPlays: (plays ?? []).length,
  };
}
