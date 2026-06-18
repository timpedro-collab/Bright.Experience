/** Client table with inline new/edit for packages. */
"use client";

import { useState } from "react";
import { Plus, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PackageForm } from "./PackageForm";

interface Pkg {
  id: string;
  name: string;
  slug: string;
  tier: string;
  base_price: number | null;
  is_bookable: boolean;
  machineName: string | null;
}

interface PackagesTableProps {
  packages: Pkg[];
  allMachines: { id: string; name: string }[];
}

export function PackagesTable({ packages, allMachines }: PackagesTableProps) {
  const [showNew, setShowNew] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{packages.length} packages</p>
        <Button size="sm" onClick={() => setShowNew(true)} disabled={showNew}>
          <Plus size={14} /> New package
        </Button>
      </div>

      {showNew && <PackageForm machines={allMachines} onClose={() => setShowNew(false)} />}

      <div className="border-t border-b border-border/40 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border/40 text-left">
              <th className="px-4 py-3 text-overline text-muted-foreground font-normal">Name</th>
              <th className="px-4 py-3 text-overline text-muted-foreground font-normal">Tier</th>
              <th className="px-4 py-3 text-overline text-muted-foreground font-normal">Machine</th>
              <th className="px-4 py-3 text-right text-overline text-muted-foreground font-normal">Base price</th>
              <th className="px-4 py-3 text-overline text-muted-foreground font-normal">Bookable</th>
              <th className="px-4 py-3 text-overline text-muted-foreground font-normal" />
            </tr>
          </thead>
          <tbody>
            {packages.map((p) =>
              editId === p.id ? (
                <tr key={p.id}>
                  <td colSpan={6} className="p-2">
                    <PackageForm pkg={p} machines={allMachines} onClose={() => setEditId(null)} />
                  </td>
                </tr>
              ) : (
                <tr key={p.id} className="border-b border-border/30 hover:bg-accent/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-[10px] uppercase">{p.tier}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.machineName ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-mono text-foreground tabular-nums">
                    {p.base_price != null ? `£${p.base_price.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={p.is_bookable ? "success" : "muted"}>
                      {p.is_bookable ? "Yes" : "No"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setEditId(p.id)}>
                      <Pencil size={14} />
                    </Button>
                  </td>
                </tr>
              ),
            )}
            {packages.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No packages configured yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
