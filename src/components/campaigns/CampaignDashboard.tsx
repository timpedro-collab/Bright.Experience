/** Campaign detail dashboard with aggregate metrics and event list. */
import {
  Calendar,
  MapPin,
  Activity,
  TrendingUp,
  Layers,
  Timer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard, KpiGrid } from "@/components/cloud";
import { CampaignEventActions } from "@/components/campaigns/CampaignEventActions";
import { CampaignStatusControl } from "@/components/campaigns/CampaignStatusControl";
import { cn } from "@/lib/utils";
import { formatDateMedium } from "@/lib/dates";
import { STAGE_CONFIG } from "@/types/core";
import type { Stage } from "@/types/core";

interface CampaignDashboardProps {
  campaign: Record<string, unknown>;
  events: Array<Record<string, unknown>>;
  /** Latest snapshot totals per event id, for the side-by-side comparison. */
  metricsByEvent?: Map<string, { totalPlays: number; totalLeads: number }>;
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  active: { label: "Active", className: "bg-brand/20 text-brand" },
  completed: { label: "Completed", className: "bg-success/20 text-success" },
  archived: { label: "Archived", className: "bg-muted text-muted-foreground" },
};

const HEALTH_MAP: Record<string, string> = {
  green: "text-success",
  amber: "text-warning",
  red: "text-destructive",
};

export function CampaignDashboard({
  campaign,
  events,
  metricsByEvent,
}: CampaignDashboardProps) {
  const campaignId = String(campaign.id ?? "");
  const status = String(campaign.status ?? "draft");
  const statusConfig = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  const metrics = (campaign.aggregate_metrics_json ?? {}) as Record<string, unknown>;
  const engagedMinutes = Number(metrics.engagedMinutes ?? 0);

  return (
    <div className="space-y-6">
      {/* Overview KPI cards */}
      <KpiGrid>
        <KpiCard icon={Layers} label="Total events" value={String(events.length)} />
        <KpiCard
          icon={Activity}
          label="Total plays"
          value={formatNumber(metrics.totalPlays)}
        />
        <KpiCard
          icon={TrendingUp}
          label="Total leads"
          value={formatNumber(metrics.totalLeads)}
        />
        {engagedMinutes > 0 ? (
          <KpiCard
            icon={Timer}
            label="Engaged minutes"
            value={formatNumber(engagedMinutes)}
          />
        ) : (
          <KpiCard icon={Calendar} label="Status" value={statusConfig.label} />
        )}
      </KpiGrid>

      {/* Lifecycle status control */}
      {campaignId ? (
        <CampaignStatusControl campaignId={campaignId} status={status} />
      ) : null}

      {/* Campaign timeline */}
      {(campaign.start_date || campaign.end_date) ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Campaign period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {campaign.start_date ? formatDateMedium(String(campaign.start_date)) : "TBD"} — {campaign.end_date ? formatDateMedium(String(campaign.end_date)) : "TBD"}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* Event list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Campaign events ({events.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No events linked to this campaign yet.
            </p>
          ) : (
            <div className="space-y-2">
              {events.map((ce) => {
                const evt = (ce.events ?? ce) as Record<string, unknown>;
                const health = String(evt.health_status ?? "green");
                const eventMetrics = metricsByEvent?.get(String(evt.id ?? ""));
                return (
                  <div
                    key={String(ce.id ?? evt.id)}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {String(evt.name ?? "Untitled")}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        {evt.venue_name ? (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin size={12} />
                            {String(evt.venue_name)}
                          </span>
                        ) : null}
                        {evt.event_date_start ? (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar size={12} />
                            {formatDateMedium(String(evt.event_date_start))}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      {eventMetrics && (
                        <span className="hidden sm:inline text-xs tabular-nums text-muted-foreground">
                          {eventMetrics.totalPlays.toLocaleString("en-GB")} plays
                          {" · "}
                          {eventMetrics.totalLeads.toLocaleString("en-GB")} leads
                        </span>
                      )}
                      <Badge
                        className={cn(
                          "border-0 text-xs",
                          HEALTH_MAP[health] ?? "text-muted-foreground",
                          health === "green" && "bg-success/10",
                          health === "amber" && "bg-warning/10",
                          health === "red" && "bg-destructive/10"
                        )}
                      >
                        {STAGE_CONFIG[String(evt.current_stage ?? "confirmed") as Stage]?.shortLabel ?? "Confirmed"}
                      </Badge>
                      {campaignId && evt.id ? (
                        <CampaignEventActions
                          campaignId={campaignId}
                          eventId={String(evt.id)}
                          eventName={String(evt.name ?? "Untitled")}
                        />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatNumber(val: unknown): string {
  if (val === undefined || val === null) return "0";
  const num = Number(val);
  if (isNaN(num)) return "0";
  return num.toLocaleString("en-US");
}
