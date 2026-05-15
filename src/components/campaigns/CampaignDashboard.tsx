/** Campaign detail dashboard with aggregate metrics and event list. */
import {
  Calendar,
  MapPin,
  Activity,
  TrendingUp,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CampaignDashboardProps {
  campaign: Record<string, unknown>;
  events: Array<Record<string, unknown>>;
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

export function CampaignDashboard({ campaign, events }: CampaignDashboardProps) {
  const status = String(campaign.status ?? "draft");
  const statusConfig = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  const metrics = (campaign.aggregate_metrics_json ?? {}) as Record<string, unknown>;

  return (
    <div className="space-y-6">
      {/* Overview KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Layers}
          label="Total Events"
          value={String(events.length)}
        />
        <KpiCard
          icon={Activity}
          label="Total Interactions"
          value={formatNumber(metrics.totalInteractions)}
        />
        <KpiCard
          icon={TrendingUp}
          label="Total Leads"
          value={formatNumber(metrics.totalLeads)}
        />
        <KpiCard
          icon={Calendar}
          label="Status"
          value={statusConfig.label}
        />
      </div>

      {/* Campaign timeline */}
      {(campaign.start_date || campaign.end_date) ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-text-primary">
              Campaign Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-secondary">
              {String(campaign.start_date ?? "TBD")} — {String(campaign.end_date ?? "TBD")}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* Event list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-text-primary">
            Campaign Events ({events.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-text-muted py-4 text-center">
              No events linked to this campaign yet.
            </p>
          ) : (
            <div className="space-y-2">
              {events.map((ce) => {
                const evt = (ce.events ?? ce) as Record<string, unknown>;
                const health = String(evt.health_status ?? "green");
                return (
                  <div
                    key={String(ce.id ?? evt.id)}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {String(evt.name ?? "Untitled")}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        {evt.venue_name ? (
                          <span className="flex items-center gap-1 text-xs text-text-muted">
                            <MapPin size={12} />
                            {String(evt.venue_name)}
                          </span>
                        ) : null}
                        {evt.event_date_start ? (
                          <span className="flex items-center gap-1 text-xs text-text-muted">
                            <Calendar size={12} />
                            {String(evt.event_date_start)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <Badge
                        className={cn(
                          "border-0 text-xs",
                          HEALTH_MAP[health] ?? "text-text-muted",
                          health === "green" && "bg-success/10",
                          health === "amber" && "bg-warning/10",
                          health === "red" && "bg-destructive/10"
                        )}
                      >
                        {String(evt.current_stage ?? "confirmed")}
                      </Badge>
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

function KpiCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/40">
          <Icon size={20} className="text-brand" />
        </div>
        <div>
          <p className="text-overline text-text-muted">{label}</p>
          <p className="text-heading text-lg font-semibold text-text-primary tabular-nums">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function formatNumber(val: unknown): string {
  if (val === undefined || val === null) return "0";
  const num = Number(val);
  if (isNaN(num)) return "0";
  return num.toLocaleString();
}
