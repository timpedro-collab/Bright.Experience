/** Read queries for deal registrations — organizer board + internal review queue. */

import { createClient } from "@/lib/supabase/server";
import { logQueryError } from "@/lib/observability/log-query-error";
import {
  effectiveDealStatus,
  type DealRegistration,
  type DealRegistrationStatus,
  type DealRegistrationSource,
} from "@/lib/deal-registrations";

const DEAL_COLUMNS = `id, partner_id, event_id, quote_id, sponsor_company,
  sponsor_contact_name, sponsor_contact_email, estimated_value, notes,
  status, exclusivity_expires_at, source, rejected_reason, approved_at,
  created_at`;

function toDealRegistration(row: Record<string, unknown>): DealRegistration {
  const storedStatus = String(row.status) as DealRegistrationStatus;
  const exclusivity = (row.exclusivity_expires_at as string | null) ?? null;
  return {
    id: String(row.id),
    partnerId: String(row.partner_id),
    eventId: (row.event_id as string | null) ?? null,
    quoteId: (row.quote_id as string | null) ?? null,
    sponsorCompany: String(row.sponsor_company),
    sponsorContactName: (row.sponsor_contact_name as string | null) ?? null,
    sponsorContactEmail: (row.sponsor_contact_email as string | null) ?? null,
    estimatedValue:
      row.estimated_value != null ? Number(row.estimated_value) : null,
    notes: (row.notes as string | null) ?? null,
    // A lapsed approval reads as expired without waiting for a sweep.
    status: effectiveDealStatus(storedStatus, exclusivity),
    exclusivityExpiresAt: exclusivity,
    source: String(row.source) as DealRegistrationSource,
    rejectedReason: (row.rejected_reason as string | null) ?? null,
    approvedAt: (row.approved_at as string | null) ?? null,
    createdAt: String(row.created_at),
  };
}

/** A partner's registrations, newest first. RLS scopes the read. */
export async function getDealsByPartner(
  partnerId: string,
): Promise<DealRegistration[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deal_registrations")
    .select(DEAL_COLUMNS)
    .eq("partner_id", partnerId)
    .order("created_at", { ascending: false })
    .range(0, 99);

  if (error) {
    logQueryError("getDealsByPartner", error, { partnerId });
    return [];
  }
  return (data ?? []).map((row) =>
    toDealRegistration(row as Record<string, unknown>),
  );
}

/** One registration row plus the partner it belongs to, for the review queue. */
export interface AdminDealRow extends DealRegistration {
  partnerName: string;
  partnerSlug: string;
}

/** Every registration for the internal review queue, pending first. */
export async function getDealRegistrationsForAdmin(): Promise<AdminDealRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deal_registrations")
    .select(`${DEAL_COLUMNS}, partners:partner_id ( name, slug )`)
    .order("created_at", { ascending: false })
    .range(0, 199);

  if (error) {
    logQueryError("getDealRegistrationsForAdmin", error, {});
    return [];
  }

  const rows = (data ?? []).map((row) => {
    const record = row as Record<string, unknown>;
    const partner = Array.isArray(record.partners)
      ? (record.partners[0] as Record<string, unknown> | undefined)
      : (record.partners as Record<string, unknown> | null);
    return {
      ...toDealRegistration(record),
      partnerName: partner?.name ? String(partner.name) : "Unknown partner",
      partnerSlug: partner?.slug ? String(partner.slug) : "",
    };
  });

  // Pending first — the queue exists to hit the 24h review SLA.
  return rows.sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (b.status === "pending" && a.status !== "pending") return 1;
    return 0;
  });
}
