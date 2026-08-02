import { createClient } from "@/lib/supabase/server";
import { createSignedReadUrl } from "@/lib/storage/signed-url";
import type { Approval } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logQueryError } from "@/lib/observability/log-query-error";

/**
 * Resolve a stored `preview_url` into something the browser can open.
 * Absolute URLs and leading-slash public paths pass through unchanged;
 * anything else is treated as an object path in the private
 * `event-assets` bucket and gets a short-lived signed URL.
 */
async function resolvePreviewUrl(
  supabase: SupabaseClient,
  previewUrl: string | null
): Promise<string | undefined> {
  if (!previewUrl) return undefined;
  if (
    previewUrl.startsWith("http://") ||
    previewUrl.startsWith("https://") ||
    previewUrl.startsWith("/")
  ) {
    return previewUrl;
  }
  const signed = await createSignedReadUrl(supabase, "event-assets", previewUrl);
  return signed ?? undefined;
}

export async function getApprovalsByEvent(
  eventId: string
): Promise<Approval[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("approvals")
    .select("*")
    .eq("event_id", eventId)
    .order("requested_at", { ascending: false });

  if (error || !data) {
    logQueryError("getApprovalsByEvent", error, { eventId });
    return [];
  }

  return Promise.all(
    data.map(async (row) => ({
      id: row.id,
      eventId: row.event_id,
      title: row.title,
      description: row.description ?? undefined,
      approvalType: row.approval_type,
      status: row.status,
      previewUrl: await resolvePreviewUrl(supabase, row.preview_url ?? null),
      requestedBy: row.requested_by ?? undefined,
      requestedAt: row.requested_at,
      decidedBy: row.decided_by ?? undefined,
      decidedAt: row.decided_at ?? undefined,
      feedback: row.feedback ?? undefined,
      revisionCount: row.revision_count,
      customerVisible: row.customer_visible,
    }))
  );
}
