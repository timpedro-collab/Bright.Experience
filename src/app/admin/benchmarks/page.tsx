/** Internal benchmark management — read-only table of benchmarks grouped by event type */
import { redirect } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { getBenchmarks } from "@/lib/queries/benchmarks";
import type { Benchmark } from "@/types";

function formatLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function BenchmarksPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const isInternal = isInternalRole(user.role);
  if (!isInternal) redirect("/");

  const benchmarks = await getBenchmarks();

  const grouped = benchmarks.reduce<Record<string, Benchmark[]>>((acc, b) => {
    const key = b.eventType ?? "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(b);
    return acc;
  }, {});

  const eventTypes = Object.keys(grouped).sort();

  return (
    <AppShell user={user} isInternal={isInternal}>
      <PageHeader
        title="Benchmarks"
        subtitle="Category performance benchmarks for reporting comparisons"
        breadcrumbs={[{ label: "Admin", href: "/admin/catalog" }, { label: "Benchmarks" }]}
      />

      {eventTypes.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No benchmarks yet"
          description="Benchmarks are automatically generated as events complete."
        />
      ) : (
        <div className="space-y-6">
          {eventTypes.map((eventType) => (
            <Card key={eventType}>
              <CardHeader className="pb-3">
                <CardTitle className="text-heading text-base font-semibold flex items-center gap-2">
                  {formatLabel(eventType)}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {grouped[eventType].length} benchmarks
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Machine</TableHead>
                      <TableHead>Game</TableHead>
                      <TableHead>Metric</TableHead>
                      <TableHead className="text-right">Average</TableHead>
                      <TableHead className="text-right">Median</TableHead>
                      <TableHead className="text-right">Sample Size</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grouped[eventType].map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>{b.machineType ?? "All"}</TableCell>
                        <TableCell className="text-muted-foreground">{b.gameType ?? "All"}</TableCell>
                        <TableCell className="font-medium">{formatLabel(b.metricName)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {b.avgValue != null ? b.avgValue.toLocaleString() : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {b.medianValue != null ? b.medianValue.toLocaleString() : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {b.sampleSize ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
