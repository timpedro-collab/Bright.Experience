/**
 * Admin Pipedrive setup page.
 *
 * Single screen for the AE to wire the integration up:
 *   - Paste token, base URL override, custom-field keys, health
 *     option IDs, default pipeline.
 *   - Test-connection button.
 *   - Manual outbox drain.
 *   - Tail of the last 20 outbox rows with status / error.
 *
 * Internal-only — anyone else gets redirected back to the dashboard.
 */

import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { getUnreadCount } from "@/lib/queries/notifications";

import { PipedriveSetupForm } from "@/components/admin/PipedriveSetupForm";
import { PipedriveOutboxTail } from "@/components/admin/PipedriveOutboxTail";

export const metadata = {
  title: "Pipedrive integration · Bright.Experience",
};

interface ConfigRow {
  api_token: string | null;
  base_url: string;
  field_key_last_activity_at: string | null;
  field_key_health_status: string | null;
  field_key_delivered_events: string | null;
  health_option_green_id: number | null;
  health_option_amber_id: number | null;
  health_option_red_id: number | null;
  default_pipeline_id: number | null;
  updated_at: string | null;
}

export interface OutboxEntry {
  id: string;
  eventId: string | null;
  dealId: string | null;
  kind: string;
  attempts: number;
  lastError: string | null;
  sentAt: string | null;
  createdAt: string;
  title: string | null;
}

export default async function PipedriveAdminPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const isInternal = isInternalRole(user.role);
  if (!isInternal) redirect("/");

  const supabase = getServiceRoleClient();
  const [configRes, outboxRes, unread] = await Promise.all([
    supabase.from("pipedrive_config").select("*").eq("id", 1).maybeSingle(),
    supabase
      .from("pipedrive_outbox")
      .select("id, event_id, deal_id, kind, attempts, last_error, sent_at, created_at, payload")
      .order("created_at", { ascending: false })
      .limit(20),
    getUnreadCount(user.id),
  ]);

  const config = (configRes.data as ConfigRow | null) ?? null;
  const outbox: OutboxEntry[] = (
    (outboxRes.data ?? []) as Array<Record<string, unknown>>
  ).map((row) => ({
    id: String(row.id),
    eventId: (row.event_id as string) ?? null,
    dealId: (row.deal_id as string) ?? null,
    kind: String(row.kind),
    attempts: Number(row.attempts ?? 0),
    lastError: (row.last_error as string) ?? null,
    sentAt: (row.sent_at as string) ?? null,
    createdAt: String(row.created_at),
    title:
      (row.payload as { title?: string } | null)?.title ?? null,
  }));

  const tokenConfigured = Boolean(
    config?.api_token || process.env.PIPEDRIVE_API_TOKEN
  );

  return (
    <AppShell user={user} isInternal={isInternal} notificationCount={unread}>
      <PageHeader
        eyebrow="Integration"
        title="Pipedrive write-back"
        subtitle={
          tokenConfigured
            ? "Connected. Bright.Experience pushes delivery milestones to linked deals."
            : "Paste a Pipedrive API token to start syncing delivery milestones to your deals."
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card tone="subtle">
            <CardContent className="p-6">
              <PipedriveSetupForm
                initialValues={{
                  apiTokenMasked: config?.api_token
                    ? `${config.api_token.slice(0, 4)}••••${config.api_token.slice(-4)}`
                    : "",
                  baseUrl: config?.base_url ?? "https://api.pipedrive.com",
                  fieldKeyLastActivityAt:
                    config?.field_key_last_activity_at ?? "",
                  fieldKeyHealthStatus: config?.field_key_health_status ?? "",
                  fieldKeyDeliveredEvents:
                    config?.field_key_delivered_events ?? "",
                  healthOptionGreenId: config?.health_option_green_id ?? null,
                  healthOptionAmberId: config?.health_option_amber_id ?? null,
                  healthOptionRedId: config?.health_option_red_id ?? null,
                  defaultPipelineId: config?.default_pipeline_id ?? null,
                }}
                tokenConfigured={tokenConfigured}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card tone="subtle">
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-overline text-muted-foreground">How it works</p>
                <p className="mt-2 text-sm text-foreground">
                  When an event is linked to a Pipedrive deal, Bright.Experience writes a short note on the deal at six key moments and updates three custom fields. Everything else stays out of Pipedrive.
                </p>
              </div>
              <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
                <li>Proposal accepted (delivery kickoff)</li>
                <li>Stage advanced (creative, approvals, QA, live, reporting)</li>
                <li>Customer approved a proof / requested a revision</li>
                <li>Bright.Blue creative reviewed a customer upload</li>
                <li>Event went live</li>
                <li>Event delivered + final report ready</li>
              </ul>
              <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-muted-foreground">
                Pipedrive being unreachable never blocks the portal — every write is queued in <code className="text-foreground">pipedrive_outbox</code> and retried hourly.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8">
        <PipedriveOutboxTail rows={outbox} />
      </div>
    </AppShell>
  );
}
