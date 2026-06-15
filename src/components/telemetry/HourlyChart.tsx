/** Hourly activity chart — plays vs leads by hour, in the Cloud chart style. */
"use client";

import { ChartCard, CloudBarChart } from "@/components/cloud";

interface HourlyDataPoint {
  hour: number;
  plays: number;
  leads: number;
}

interface HourlyChartProps {
  data: HourlyDataPoint[];
}

function formatHour(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  return `${h}${period}`;
}

export function HourlyChart({ data }: HourlyChartProps) {
  const chartData = data.map((d) => ({
    name: formatHour(d.hour),
    plays: d.plays,
    leads: d.leads,
  }));

  return (
    <ChartCard title="Activity by hour" description="Plays and leads across the day">
      <CloudBarChart
        data={chartData}
        xKey="name"
        showLegend
        series={[
          { key: "plays", name: "Plays", tone: "primary" },
          { key: "leads", name: "Leads", tone: "accent" },
        ]}
      />
    </ChartCard>
  );
}
