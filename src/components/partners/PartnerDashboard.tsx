/** Partner pipeline dashboard — earnings KPIs and partner status overview */
import { Badge } from "@/components/ui/badge";
import { HeroMetric, HeroMetricSatellite } from "@/components/ui/hero-metric";
import { cn } from "@/lib/utils";
import { formatUSDFromCents } from "@/lib/currency";

interface PartnerSummary {
  /** All amounts are integer cents. */
  totalEarned: number;
  pending: number;
  paid: number;
  activeQuotes: number;
  activeEvents: number;
}

interface PartnerDashboardProps {
  partner: Record<string, unknown>;
  summary: PartnerSummary;
  partnerSlug?: string;
}

const STATUS_STYLES: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "muted" }> = {
  active: { label: "Active", variant: "success" },
  pending: { label: "Pending approval", variant: "warning" },
  suspended: { label: "Suspended", variant: "destructive" },
  inactive: { label: "Inactive", variant: "muted" },
};

function formatGBP(cents: number): string {
  return formatUSDFromCents(cents);
}

export function PartnerDashboard({ partner, summary, partnerSlug }: PartnerDashboardProps) {
  const status = String(partner.status ?? "pending");
  const statusConfig = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  const partnerCode = String(partner.partner_code ?? partner.partnerCode ?? "—");
  const partnerName = String(partner.name ?? "Partner");

  return (
    <div className="space-y-5">
      <div
        className={cn(
          "flex flex-col gap-3 rounded-[var(--radius-card)] border border-white/[0.06]",
          "bg-[hsl(233,56%,11%,0.55)] backdrop-blur-md p-5",
          "sm:flex-row sm:items-center sm:justify-between"
        )}
      >
        <div>
          <p className="text-overline text-muted-foreground">Partner account</p>
          <h2 className="text-heading text-xl font-semibold text-foreground mt-1">
            {partnerName}
          </h2>
          <div className="mt-3 flex items-center gap-2.5">
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            <span className="text-overline text-muted-foreground">
              CODE&nbsp;
              <code className="rounded bg-white/[0.04] px-1.5 py-0.5 font-mono text-primary">
                {partnerCode}
              </code>
            </span>
          </div>
        </div>
      </div>

      <HeroMetric
        label="Pipeline value"
        value={formatGBP(summary.totalEarned)}
        tone="default"
        hint={`${formatGBP(summary.paid)} paid · ${formatGBP(summary.pending)} pending`}
        animate={false}
        satellites={
          <>
            <HeroMetricSatellite label="Paid" value={formatGBP(summary.paid)} animate={false} />
            <HeroMetricSatellite
              label="Active quotes"
              value={summary.activeQuotes}
              tone={summary.activeQuotes > 0 ? "info" : "default"}
            />
            <HeroMetricSatellite
              label="Active events"
              value={summary.activeEvents}
              tone={summary.activeEvents > 0 ? "success" : "default"}
            />
          </>
        }
      />
      {partnerSlug && (
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <a
            href={`/partners/${partnerSlug}/commissions`}
            className="rounded-[var(--radius-chip)] border border-border bg-muted/40 px-3 py-1.5 transition-colors hover:border-border hover:text-foreground"
          >
            View commissions
          </a>
          <a
            href={`/partners/${partnerSlug}/quotes`}
            className="rounded-[var(--radius-chip)] border border-border bg-muted/40 px-3 py-1.5 transition-colors hover:border-border hover:text-foreground"
          >
            View quotes
          </a>
          <a
            href={`/partners/${partnerSlug}/clients`}
            className="rounded-[var(--radius-chip)] border border-border bg-muted/40 px-3 py-1.5 transition-colors hover:border-border hover:text-foreground"
          >
            View clients
          </a>
        </div>
      )}
    </div>
  );
}
