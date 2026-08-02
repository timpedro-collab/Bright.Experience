/** Supabase read queries for partner attribution and commission tracking. */
import { createClient } from "@/lib/supabase/server";
import { logQueryError } from "@/lib/observability/log-query-error";

export type CommissionStatus = "pending" | "approved" | "paid" | "rejected";

/**
 * A single referral in the partner's book of business, enriched with the
 * real client name, deal value, and stage so the portal never has to render
 * raw UUIDs. `kind` distinguishes a still-open quote from a won event.
 */
export interface PartnerDeal {
  id: string;
  kind: "quote" | "event";
  /** Real client/company name, e.g. "Coca-Cola UK". */
  clientName: string;
  /** Short descriptor of the work, e.g. "Samsung Galaxy Launch". */
  dealName: string;
  eventType?: string;
  /** Headline deal value in integer cents (quote total / proposal value). */
  valueCents?: number;
  /** Commission to the partner in integer cents. */
  commissionCents?: number;
  status: CommissionStatus;
  /** Delivery stage when the deal is a won event. */
  stage?: string;
  health?: string;
  createdAt: string;
  paidAt?: string;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function titleCase(s: string): string {
  return s.replace(/(^|\s|_)\w/g, (m) => m.toUpperCase()).replace(/_/g, " ");
}

/** Fetch all attributions for a partner, most recent first. */
export async function getAttributionsByPartner(partnerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partner_attributions")
    .select(
      `id, partner_id, quote_id, event_id,
       commission_amount, commission_status, paid_at,
       created_at, updated_at`
    )
    .eq("partner_id", partnerId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    logQueryError("getAttributionsByPartner", error, { partnerId });
    return [];
  }
  return data;
}

/** Aggregate commission totals for a partner: earned, pending, and paid. */
export async function getPartnerCommissionSummary(partnerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partner_attributions")
    .select("commission_amount, commission_status")
    .eq("partner_id", partnerId);

  if (error || !data) {
    logQueryError("getPartnerCommissionSummary", error, { partnerId });
    return { totalEarned: 0, totalPending: 0, totalPaid: 0, totalApproved: 0 };
  }

  let totalEarned = 0;
  let totalPending = 0;
  let totalPaid = 0;
  let totalApproved = 0;

  for (const row of data) {
    const amount = Number(row.commission_amount) || 0;
    totalEarned += amount;
    if (row.commission_status === "pending") totalPending += amount;
    if (row.commission_status === "approved") totalApproved += amount;
    if (row.commission_status === "paid") totalPaid += amount;
  }

  return { totalEarned, totalPending, totalPaid, totalApproved };
}

/**
 * The partner's full book of business with client names, deal values and
 * stages resolved — the single source feeding the dashboard, clients,
 * quotes and commissions surfaces. Replaces the old "render a UUID" tables.
 */
export async function getPartnerPipeline(partnerId: string): Promise<PartnerDeal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partner_attributions")
    .select(
      `id, quote_id, event_id, commission_amount, commission_status, paid_at, created_at,
       quotes(id, company_name, contact_name, event_type, event_date_start, total_amount, status),
       events(id, name, event_type, current_stage, health_status, event_date_start, accounts(name))`,
    )
    .eq("partner_id", partnerId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    logQueryError("getPartnerPipeline", error, { partnerId });
    return [];
  }

  return data.map((row: Record<string, unknown>): PartnerDeal => {
    const quote = asRecord(row.quotes);
    const event = asRecord(row.events);
    const account = event ? asRecord(event.accounts) : null;

    // A won event takes precedence as the "deal name"; the client name comes
    // from the event's account, falling back to the quote's company.
    const clientName =
      (account?.name as string) ||
      (quote?.company_name as string) ||
      "Unattributed client";

    const dealName = event
      ? (event.name as string)
      : quote
        ? `${quote.company_name as string} — ${titleCase(String(quote.event_type ?? "activation"))}`
        : "Referral";

    const eventType = (event?.event_type as string) ?? (quote?.event_type as string);
    const valueCents =
      quote?.total_amount != null
        ? Number(quote.total_amount)
        : undefined;

    return {
      id: String(row.id),
      kind: event ? "event" : "quote",
      clientName,
      dealName,
      eventType,
      valueCents,
      commissionCents:
        row.commission_amount != null ? Number(row.commission_amount) : undefined,
      status: (String(row.commission_status ?? "pending") as CommissionStatus),
      stage: event?.current_stage as string | undefined,
      health: event?.health_status as string | undefined,
      createdAt: String(row.created_at),
      paidAt: row.paid_at ? String(row.paid_at) : undefined,
    };
  });
}
