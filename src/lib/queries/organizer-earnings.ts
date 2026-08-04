/** Read queries for organizer sponsorship earnings and pipeline margins. */
import { createClient } from "@/lib/supabase/server";
import { logQueryError } from "@/lib/observability/log-query-error";
import { slotEconomics } from "@/lib/pricing/slot-economics";

export interface EarningsSlot {
  slotId: string;
  eventId: string;
  showName: string;
  sponsorName: string | null;
  status: string;
  startDate: string;
  endDate: string;
  rackPence: number | null;
  wholesalePence: number | null;
  marginPence: number | null;
}

export interface OrganizerEarnings {
  slots: EarningsSlot[];
  soldMarginPence: number;
  pipelineMarginPence: number;
  soldCount: number;
  pipelineCount: number;
}

const EMPTY: OrganizerEarnings = {
  slots: [],
  soldMarginPence: 0,
  pipelineMarginPence: 0,
  soldCount: 0,
  pipelineCount: 0,
};

const SOLD_STATUSES = new Set(["active", "completed"]);
const PIPELINE_STATUSES = new Set(["reserved"]);

/**
 * Accrued and pipeline margins for every sponsorship slot across an
 * organizer's shows. Follows the same two-step fetch as getSlotsByOrganizer.
 */
export async function getEarningsByOrganizer(
  partnerId: string
): Promise<OrganizerEarnings> {
  const supabase = await createClient();
  const { data: shows, error: showsError } = await supabase
    .from("events")
    .select("id, name")
    .eq("organizer_partner_id", partnerId);

  if (showsError || !shows) {
    logQueryError("getEarningsByOrganizer", showsError, { partnerId });
    return EMPTY;
  }

  const showIds = (shows ?? []).map((s) => String((s as { id: string }).id));
  if (showIds.length === 0) return EMPTY;

  const showNames = new Map(
    (shows ?? []).map((s) => [
      String((s as { id: string }).id),
      String((s as { name: string }).name),
    ])
  );

  const { data, error } = await supabase
    .from("sponsorship_slots")
    .select(
      "id, event_id, sponsor_name, status, start_date, end_date, price, wholesale_price"
    )
    .in("event_id", showIds)
    .order("start_date", { ascending: true });

  if (error || !data) {
    logQueryError("getEarningsByOrganizer", error, { partnerId });
    return EMPTY;
  }

  let soldMarginPence = 0;
  let pipelineMarginPence = 0;
  let soldCount = 0;
  let pipelineCount = 0;

  const slots: EarningsSlot[] = (data as Record<string, unknown>[]).map(
    (row) => {
      const economics = slotEconomics({
        pricePence: row.price != null ? Number(row.price) : null,
        wholesalePence:
          row.wholesale_price != null ? Number(row.wholesale_price) : null,
      });
      const status = String(row.status ?? "");
      const margin = economics.marginPence ?? 0;

      if (SOLD_STATUSES.has(status)) {
        soldCount += 1;
        soldMarginPence += margin;
      } else if (PIPELINE_STATUSES.has(status)) {
        pipelineCount += 1;
        pipelineMarginPence += margin;
      }

      return {
        slotId: String(row.id),
        eventId: String(row.event_id),
        showName: showNames.get(String(row.event_id)) ?? "Unknown show",
        sponsorName: row.sponsor_name ? String(row.sponsor_name) : null,
        status,
        startDate: String(row.start_date),
        endDate: String(row.end_date),
        rackPence: economics.rackPence,
        wholesalePence: economics.wholesalePence,
        marginPence: economics.marginPence,
      };
    }
  );

  slots.sort((a, b) => {
    const byShow = a.showName.localeCompare(b.showName);
    if (byShow !== 0) return byShow;
    return a.startDate.localeCompare(b.startDate);
  });

  return {
    slots,
    soldMarginPence,
    pipelineMarginPence,
    soldCount,
    pipelineCount,
  };
}
