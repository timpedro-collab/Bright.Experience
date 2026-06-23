/** Cross-event KPI dashboard tabs — "This event" | "Last 6 months" | "This year". */
"use client";

import { useState, useEffect } from "react";
import { Users, Target, Eye, Calendar } from "lucide-react";
import { MetricCard } from "@/components/reports/MetricCard";
import { cn } from "@/lib/utils";

type TabKey = "this_event" | "last_6_months" | "this_year";

const TABS: { key: TabKey; label: string }[] = [
  { key: "this_event", label: "This event" },
  { key: "last_6_months", label: "Last 6 months" },
  { key: "this_year", label: "This year" },
];

interface AggregateData {
  totalPlays: number;
  totalLeads: number;
  totalEvents: number;
  avgCostPerLead: number | null;
  totalInteractions: number;
}

interface DashboardTabsProps {
  accountId: string;
  children: React.ReactNode;
}

export function DashboardTabs({ accountId, children }: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("this_event");
  const [aggregate, setAggregate] = useState<AggregateData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // The "this_event" tab renders `children`, never the aggregate, so there's
    // nothing to fetch or reset here.
    if (activeTab === "this_event") return;

    const now = new Date();
    let startDate: string;
    if (activeTab === "last_6_months") {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 6);
      startDate = d.toISOString().split("T")[0];
    } else {
      startDate = `${now.getFullYear()}-01-01`;
    }
    const endDate = now.toISOString().split("T")[0];

    // Data-fetching effect: mark loading before the network round-trip.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/aggregate-metrics?accountId=${accountId}&startDate=${startDate}&endDate=${endDate}`)
      .then((r) => r.json())
      .then((data) => setAggregate(data))
      .catch(() => setAggregate(null))
      .finally(() => setLoading(false));
  }, [activeTab, accountId]);

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-border/40 pb-px">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors rounded-t-md -mb-px",
              activeTab === tab.key
                ? "text-foreground border-b-2 border-brand"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "this_event" ? (
        children
      ) : loading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Loading aggregate metrics…
        </div>
      ) : aggregate ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-4">
          <MetricCard icon={Calendar} label="Events" value={aggregate.totalEvents.toLocaleString("en-US")} />
          <MetricCard icon={Users} label="Total plays" value={aggregate.totalPlays.toLocaleString("en-US")} />
          <MetricCard icon={Target} label="Leads" value={aggregate.totalLeads.toLocaleString("en-US")} />
          <MetricCard
            icon={Eye}
            label="Interactions"
            value={aggregate.totalInteractions.toLocaleString("en-US")}
          />
        </div>
      ) : (
        <p className="py-8 text-sm text-muted-foreground text-center">
          No aggregate data available for this period.
        </p>
      )}
    </div>
  );
}
