/** Location tier management — postcode prefix → pricing tier mapping. */
import { redirect } from "next/navigation";

import { AdminPageShell, EditorialEyebrow } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/Pagination";

import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { getLocationsPaginated } from "@/lib/queries/locations";
import { getUnreadCount } from "@/lib/queries/notifications";
import { parsePage } from "@/lib/pagination";

interface LocationsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LocationsPage({ searchParams }: LocationsPageProps) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!isInternalRole(user.role)) redirect("/");

  const params = await searchParams;
  const page = parsePage(params);

  const [result, unread] = await Promise.all([
    getLocationsPaginated(page),
    getUnreadCount(user.id),
  ]);

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="Locations"
      title="Location tiers."
      subtitle="Postcode-based pricing multipliers — the lever that turns Central London into a different price than a market town."
    >
      <section className="py-8">
        <EditorialEyebrow accent>The tier map</EditorialEyebrow>
        <div className="mt-4 border-t border-b border-border/40 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left">
                <th className="px-4 py-3 text-overline text-muted-foreground font-normal">
                  Postcode
                </th>
                <th className="px-4 py-3 text-overline text-muted-foreground font-normal">
                  Name
                </th>
                <th className="px-4 py-3 text-overline text-muted-foreground font-normal">
                  Region
                </th>
                <th className="px-4 py-3 text-overline text-muted-foreground font-normal">
                  Tier
                </th>
                <th className="px-4 py-3 text-right text-overline text-muted-foreground font-normal">
                  Multiplier
                </th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((loc) => (
                <tr
                  key={loc.postcode_prefix}
                  className="border-b border-border/30 hover:bg-accent/20 transition-colors"
                >
                  <td className="px-4 py-3 font-mono font-medium text-foreground">
                    {loc.postcode_prefix}
                  </td>
                  <td className="px-4 py-3 text-foreground">{loc.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {loc.region}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-[10px] uppercase">
                      {loc.tier}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-foreground tabular-nums">
                    {loc.media_value_multiplier}×
                  </td>
                </tr>
              ))}
              {result.data.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No location tiers configured yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={page}
          totalPages={result.totalPages}
          basePath="/admin/locations"
        />
      </section>
    </AdminPageShell>
  );
}
