/** Top-level dashboard KPI tile — scroll-triggered count-up via StatCountUp. */
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { StatCountUp } from "@/components/ui/StatCountUp";

interface DashboardKpiProps {
  label: string;
  value: string;
  hint?: string;
}

export function DashboardKpi({ label, value, hint }: DashboardKpiProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
          <StatCountUp raw={value} />
        </p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
