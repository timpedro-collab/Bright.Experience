/** Internal-user operational work queue surfaced on the dashboard */
import Link from "next/link";
import {
  Briefcase,
  Sparkles,
  Handshake,
  AlertOctagon,
  ArrowRight,
  Clock,
  AlertTriangle,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface WorkQueueItem {
  label: string;
  description: string;
  count: number;
  href: string;
  icon: React.ElementType;
  tone?: "default" | "warning" | "destructive" | "info";
}

interface InternalWorkQueueProps {
  queues: {
    newQuotes: number;
    pendingPartnerApps: number;
    newStudioOrders: number;
    blockedEvents: number;
    assetReviews: number;
    overdueAssetReviews?: number;
    stuckCustomerActions: number;
  };
}

export function InternalWorkQueue({ queues }: InternalWorkQueueProps) {
  const items: WorkQueueItem[] = [
    {
      label: "New quote requests",
      description: "Customers waiting for a proposal or confirmation",
      count: queues.newQuotes,
      href: "/admin/quotes",
      icon: Briefcase,
      tone: queues.newQuotes > 0 ? "info" : "default",
    },
    {
      label: "Studio orders to action",
      description: "Submitted creative requests awaiting confirmation",
      count: queues.newStudioOrders,
      href: "/studio",
      icon: Sparkles,
      tone: queues.newStudioOrders > 0 ? "info" : "default",
    },
    {
      label: "Asset reviews",
      description:
        (queues.overdueAssetReviews ?? 0) > 0
          ? `${queues.overdueAssetReviews} past the 2-day reviewer SLA — sign off now`
          : "Customer uploads awaiting Bright.Blue creative sign-off",
      count: queues.assetReviews,
      href: "/admin/asset-reviews",
      icon: Clock,
      tone:
        (queues.overdueAssetReviews ?? 0) > 0
          ? "warning"
          : queues.assetReviews > 0
            ? "info"
            : "default",
    },
    {
      label: "Stuck customers",
      description: "Customer-side actions stale > 7 days — time to phone",
      count: queues.stuckCustomerActions,
      href: "/admin/customer-queue",
      icon: AlertTriangle,
      tone: queues.stuckCustomerActions > 0 ? "warning" : "default",
    },
    {
      label: "Partner applications",
      description: "Pending reseller, venue and agency sign-ups",
      count: queues.pendingPartnerApps,
      href: "/admin/partners",
      icon: Handshake,
      tone: queues.pendingPartnerApps > 0 ? "warning" : "default",
    },
    {
      label: "Blocked events",
      description: "Events at red health flag requiring intervention",
      count: queues.blockedEvents,
      href: "/?filter=blocked",
      icon: AlertOctagon,
      tone: queues.blockedEvents > 0 ? "destructive" : "default",
    },
  ];

  return (
    <Card tone="subtle" className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
          <div>
            <p className="text-overline text-muted-foreground">Work queue</p>
            <p className="text-sm font-medium text-foreground">
              Pending items across your operation
            </p>
          </div>
          <span className="text-overline text-muted-foreground tabular-nums">
            {items.reduce((sum, i) => sum + i.count, 0)} open
          </span>
        </div>
        <div className="grid divide-y divide-white/[0.06] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3 xl:grid-cols-6">
          {items.map((item) => (
            <WorkQueueRow key={item.href} item={item} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function WorkQueueRow({ item }: { item: WorkQueueItem }) {
  const Icon = item.icon;
  const toneClasses = {
    default: "text-muted-foreground",
    info: "text-info",
    warning: "text-warning",
    destructive: "text-destructive",
  } as const;
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex flex-col gap-2 p-5 transition-colors",
        "hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      )}
    >
      <div className="flex items-center justify-between">
        <Icon className={cn("size-4", toneClasses[item.tone ?? "default"])} aria-hidden />
        <ArrowRight className="size-3.5 text-muted-foreground/60 transition-colors group-hover:text-foreground" aria-hidden />
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "text-heading text-3xl font-bold tabular-nums",
            item.count > 0 ? toneClasses[item.tone ?? "default"] : "text-foreground/40"
          )}
        >
          {item.count}
        </span>
        <span className="text-sm font-medium text-foreground">{item.label}</span>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
    </Link>
  );
}
