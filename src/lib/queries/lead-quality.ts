/** Supabase read query for lead email-quality roll-ups. */
import { createClient } from "@/lib/supabase/server";
import { logQueryError } from "@/lib/observability/log-query-error";

/** Safety cap for aggregate scans — enough for headline metrics, not unbounded. */
const MAX_LEAD_AGGREGATE_ROWS = 10_000;

export interface LeadQualitySummary {
  total: number;
  /** email_status = verified AND NOT is_repeat_player */
  verified: number;
  unchecked: number;
  disposable: number;
  invalid: number;
  /** is_repeat_player = true (any status) */
  repeatPlayers: number;
}

const EMPTY_SUMMARY: LeadQualitySummary = {
  total: 0,
  verified: 0,
  unchecked: 0,
  disposable: 0,
  invalid: 0,
  repeatPlayers: 0,
};

type LeadQualityRow = {
  email_status: string;
  is_repeat_player: boolean;
};

/** Aggregate lead quality buckets for an event (capped scan, reduced in code). */
export async function getLeadQualitySummary(
  eventId: string,
): Promise<LeadQualitySummary> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("email_status, is_repeat_player")
    .eq("event_id", eventId)
    .limit(MAX_LEAD_AGGREGATE_ROWS);

  if (error || !data) {
    logQueryError("getLeadQualitySummary", error, { eventId });
    return { ...EMPTY_SUMMARY };
  }

  let verified = 0;
  let unchecked = 0;
  let disposable = 0;
  let invalid = 0;
  let repeatPlayers = 0;

  for (const row of data as LeadQualityRow[]) {
    if (row.is_repeat_player) repeatPlayers += 1;

    switch (row.email_status) {
      case "verified":
        if (!row.is_repeat_player) verified += 1;
        break;
      case "unchecked":
        unchecked += 1;
        break;
      case "disposable":
        disposable += 1;
        break;
      case "invalid":
        invalid += 1;
        break;
    }
  }

  return {
    total: data.length,
    verified,
    unchecked,
    disposable,
    invalid,
    repeatPlayers,
  };
}
