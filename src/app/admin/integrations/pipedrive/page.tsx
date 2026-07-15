/**
 * Admin Pipedrive setup page.
 *
 * Single screen for the AE to wire the integration up — token, custom
 * fields, health options, default pipeline — and to monitor the outbox.
 * Internal-only.
 */

import { redirect } from "next/navigation";

import { AdminPageShell, EditorialEyebrow } from "@/components/brand";

import { getUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import { getUnreadCount } from "@/lib/queries/notifications";
import {
  getPipedriveConfig,
  getPipedriveOutboxTail,
  type PipedriveOutboxEntry,
} from "@/lib/queries/pipedrive";

import { PipedriveSetupForm } from "@/components/admin/PipedriveSetupForm";
import { PipedriveOutboxTail } from "@/components/admin/PipedriveOutboxTail";

export const metadata = {
  title: "Pipedrive integration · Bright.Experience",
};

export type OutboxEntry = PipedriveOutboxEntry;

export default async function PipedriveAdminPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!isAdminRole(user.role)) redirect("/");

  const [config, outbox, unread] = await Promise.all([
    getPipedriveConfig(),
    getPipedriveOutboxTail(20),
    getUnreadCount(user.id),
  ]);

  const tokenConfigured = Boolean(
    config?.api_token || process.env.PIPEDRIVE_API_TOKEN,
  );

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="Pipedrive"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Integrations" },
        { label: "Pipedrive" },
      ]}
      eyebrow="Internal · Integration"
      title="Pipedrive write-back."
      subtitle={
        tokenConfigured
          ? "Connected. Bright.Experience pushes delivery milestones to linked deals."
          : "Paste a Pipedrive API token to start syncing delivery milestones to your deals."
      }
    >
      <div className="py-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="border border-border/60 bg-card/30 rounded-md p-6">
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
          </div>
        </div>

        <aside>
          <EditorialEyebrow>How it works</EditorialEyebrow>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            When an event is linked to a Pipedrive deal, Bright.Experience
            writes a short note on the deal at six key moments and updates
            three custom fields. Everything else stays out of Pipedrive.
          </p>
          <ul className="mt-4 flex flex-col divide-y divide-border/40 border-t border-b border-border/40">
            {[
              "Proposal accepted (delivery kickoff)",
              "Stage advanced (creative, approvals, QA, live, reporting)",
              "Customer approved a proof / requested a revision",
              "Bright.Blue creative reviewed a customer upload",
              "Event went live",
              "Event delivered + final report ready",
            ].map((line, i) => (
              <li
                key={line}
                className="flex items-baseline gap-3 py-2.5 text-sm"
              >
                <span className="text-overline text-muted-foreground tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-foreground">{line}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-overline text-muted-foreground leading-relaxed">
            Pipedrive being unreachable never blocks the portal — every
            write is queued in <code className="text-foreground">pipedrive_outbox</code>{" "}
            and retried hourly.
          </p>
        </aside>
      </div>

      <div className="mt-2">
        <PipedriveOutboxTail rows={outbox} />
      </div>
    </AdminPageShell>
  );
}
