/** Campaign summary card for grid layouts. */
import Link from "next/link";
import { Calendar, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDateMedium } from "@/lib/dates";

interface CampaignCardProps {
  campaign: {
    id: string;
    name: string;
    status: string;
    eventCount: number;
    startDate?: string;
    endDate?: string;
  };
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  active: { label: "Active", className: "bg-brand/20 text-brand" },
  completed: { label: "Completed", className: "bg-success/20 text-success" },
  archived: { label: "Archived", className: "bg-muted text-muted-foreground" },
};

export function CampaignCard({ campaign }: CampaignCardProps) {
  const statusConfig = STATUS_STYLES[campaign.status] ?? STATUS_STYLES.draft;

  return (
    <Link href={`/admin/campaigns/${campaign.id}`}>
      <Card interactive className="h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold text-foreground truncate">
            {campaign.name}
          </CardTitle>
          <Badge
            className={cn(
              "shrink-0 border-0 text-xs",
              statusConfig.className
            )}
          >
            {statusConfig.label}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Layers size={14} className="text-muted-foreground shrink-0" />
            <span>
              {campaign.eventCount} event{campaign.eventCount !== 1 ? "s" : ""}
            </span>
          </div>
          {(campaign.startDate || campaign.endDate) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar size={14} className="text-muted-foreground shrink-0" />
              <span>
                {campaign.startDate ? formatDateMedium(campaign.startDate) : "TBD"} — {campaign.endDate ? formatDateMedium(campaign.endDate) : "TBD"}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
