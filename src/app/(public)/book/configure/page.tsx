/**
 * Book Now configurator — Server Component shell.
 *
 * Loads the chosen package (UUID + addons with `capability_slug`) and the
 * machine/game catalogues server-side so the client wizard works with
 * trustworthy data and we never round-trip a now-defunct `/api/packages`
 * endpoint. If no package slug is present, kick the customer back to the
 * packages index where they can pick one.
 */
import { redirect } from "next/navigation";

import { ConfigureClient } from "@/components/quotes/ConfigureClient";
import { getPackageBySlug } from "@/lib/queries/packages";
import { getMachines } from "@/lib/queries/machines";
import { getGames } from "@/lib/queries/games";

interface ConfigurePageProps {
  searchParams: Promise<{ package?: string; machine?: string }>;
}

export const metadata = {
  title: "Configure your booking",
  description: "Pick your machine, game, add-ons, and dates.",
};

export default async function ConfigurePage({
  searchParams,
}: ConfigurePageProps) {
  const { package: pkgSlug, machine: machineSlug } = await searchParams;
  if (!pkgSlug) {
    redirect("/catalog/packages");
  }

  const pkg = await getPackageBySlug(pkgSlug);
  if (!pkg || !pkg.is_bookable) {
    redirect("/catalog/packages");
  }

  const [machines, games] = await Promise.all([getMachines(), getGames()]);

  return (
    <ConfigureClient
      pkg={{
        id: pkg.id,
        slug: pkg.slug,
        name: pkg.name,
        basePrice: pkg.base_price ?? 0,
        addons: ((pkg as { package_addons?: PackageAddonRow[] }).package_addons ?? [])
          .filter((a) => a.capability_slug)
          .map((a) => ({
            id: a.id,
            name: a.name,
            description: a.description ?? undefined,
            price: a.price ?? 0,
            capabilitySlug: a.capability_slug as string,
          })),
      }}
      machines={machines.map((m) => ({
        id: m.id,
        name: m.name,
        slug: m.slug,
        tagline: m.tagline ?? null,
      }))}
      games={games.map((g) => ({
        id: g.id,
        name: g.name,
        slug: g.slug,
        category: g.category ?? null,
      }))}
      preSelectedMachine={machineSlug}
    />
  );
}

interface PackageAddonRow {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  capability_slug: string | null;
}
