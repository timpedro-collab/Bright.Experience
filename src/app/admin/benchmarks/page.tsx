/** Internal benchmark management — read-only table of benchmarks grouped by event type. */
import { redirect } from "next/navigation";
import { BarChart3 } from "lucide-react";

import { AdminPageShell, EditorialEyebrow } from "@/components/brand";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { RecalculateBenchmarksButton } from "@/components/reports/RecalculateBenchmarksButton";

import { getUser } from "@/lib/auth";
import { canViewCommercial } from "@/lib/roles";
import { getBenchmarks } from "@/lib/queries/benchmarks";
import { getUnreadCount } from "@/lib/queries/notifications";
import type { Benchmark } from "@/types";

function formatLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function BenchmarksPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!canViewCommercial(user.role)) redirect("/");

  const [benchmarks, unread] = await Promise.all([
    getBenchmarks(),
    getUnreadCount(user.id),
  ]);

  const grouped = benchmarks.reduce<Record<string, Benchmark[]>>((acc, b) => {
    const key = b.eventType ?? "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(b);
    return acc;
  }, {});

  const eventTypes = Object.keys(grouped).sort();

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="Benchmarks"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Admin", href: "/admin/catalog" },
        { label: "Benchmarks" },
      ]}
      title="Category benchmarks."
      subtitle="Performance benchmarks generated as events complete. Use them to set expectation and ground reporting."
    >
      <div className="py-8">
        <div className="mb-6 flex justify-end">
          <RecalculateBenchmarksButton />
        </div>
        {eventTypes.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No benchmarks yet"
            description="Benchmarks are automatically generated as events complete."
          />
        ) : (
          <div className="space-y-10">
            {eventTypes.map((eventType) => (
              <section key={eventType}>
                <div className="mb-4 flex items-baseline justify-between gap-3">
                  <EditorialEyebrow>{formatLabel(eventType)}</EditorialEyebrow>
                  <span className="text-overline text-muted-foreground tabular-nums">
                    {grouped[eventType].length} benchmarks
                  </span>
                </div>
                <div className="border-t border-b border-border/40">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Machine</TableHead>
                        <TableHead>Game</TableHead>
                        <TableHead>Metric</TableHead>
                        <TableHead className="text-right">Average</TableHead>
                        <TableHead className="text-right">Median</TableHead>
                        <TableHead className="text-right">Sample</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grouped[eventType].map((b) => (
                        <TableRow key={b.id}>
                          <TableCell>{b.machineType ?? "All"}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {b.gameType ?? "All"}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatLabel(b.metricName)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {b.avgValue != null
                              ? b.avgValue.toLocaleString()
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {b.medianValue != null
                              ? b.medianValue.toLocaleString()
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {b.sampleSize ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}
