/** Location tier management — postcode prefix to pricing tier mapping */
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { getLocations } from "@/lib/queries/locations";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";

export default async function LocationsPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const isInternal = isInternalRole(user.role);
  if (!isInternal) redirect("/");

  const locations = await getLocations();

  return (
    <AppShell user={user} isInternal={isInternal}>
      <PageHeader
        title="Location Tiers"
        subtitle="Manage postcode-based pricing multipliers"
      />

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Postcode Prefix</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Region</th>
              <th className="px-4 py-3 font-medium">Tier</th>
              <th className="px-4 py-3 text-right font-medium">Multiplier</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((loc) => (
              <tr
                key={loc.id}
                className="border-b border-border/50 hover:bg-muted/20 transition-colors"
              >
                <td className="px-4 py-3 font-mono font-medium text-foreground">
                  {loc.postcode_prefix}
                </td>
                <td className="px-4 py-3 text-foreground">{loc.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{loc.region}</td>
                <td className="px-4 py-3">
                  <Badge variant="secondary" className="text-[10px] uppercase">
                    {loc.tier}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right font-mono text-foreground">
                  {loc.multiplier}×
                </td>
              </tr>
            ))}
            {locations.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No location tiers configured yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
