"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { saveProductConfiguration, type ProductConfiguration } from "@/app/actions/game-config";
import type { UserRole } from "@/types";

interface ProductConfigFormProps {
  eventId: string;
  config: ProductConfiguration | null;
  viewerRole: UserRole;
}

/** Roles that author the configuration. QA verifies (read-only). */
const EDIT_ROLES: UserRole[] = [
  "customer_user",
  "customer_admin",
  "creative_lead",
  "events_lead",
  "admin",
  "developer",
];

type Product = ProductConfiguration["productsJson"][number];

export function ProductConfigForm({ eventId, config, viewerRole }: ProductConfigFormProps) {
  const router = useRouter();
  const [saving, startSave] = useTransition();

  const canEdit = EDIT_ROLES.includes(viewerRole);

  const [products, setProducts] = useState<Product[]>(config?.productsJson ?? []);
  const [totalUnits, setTotalUnits] = useState<string>(String(config?.totalUnits ?? ""));
  const [notes, setNotes] = useState(config?.notes ?? "");

  function handleSave() {
    startSave(async () => {
      const result = await saveProductConfiguration(eventId, {
        productsJson: products,
        totalUnits: totalUnits ? Number(totalUnits) : undefined,
        notes: notes || undefined,
      });
      if (!result.success) { toast.error(result.error); return; }
      toast.success("Product configuration saved");
      router.refresh();
    });
  }

  function updateProduct(i: number, partial: Partial<Product>) {
    const next = [...products];
    next[i] = { ...next[i], ...partial };
    setProducts(next);
  }

  // The stock-mix weighting only makes sense across multiple products — a
  // single product is always 100% of the machine.
  const multiProduct = products.length > 1;
  const mixTotal = products.reduce((sum, p) => sum + (p.stockRatio ?? 0), 0);
  const anyMixSet = products.some((p) => (p.stockRatio ?? 0) > 0);
  const mixBalanced = mixTotal === 100;

  // Column template gains the mix field only when relevant.
  const rowGrid = multiProduct
    ? "grid-cols-[1fr_110px_auto]"
    : "grid-cols-[1fr_auto]";

  return (
    <Card tone="subtle" className="p-6 space-y-6">
      {!canEdit && (
        <div className="rounded-lg border border-info/25 bg-info/8 px-4 py-3 text-sm text-muted-foreground">
          Read-only view — only the customer and the Bright.Blue delivery team
          can edit the product configuration.
        </div>
      )}

      <fieldset disabled={!canEdit} className="space-y-6 border-0 p-0 m-0 disabled:opacity-70">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Products</label>
        {multiProduct && (
          <p className="text-xs text-muted-foreground mb-2">
            Set the stock mix to weight how many of each product the machine
            holds (their share of total units). Leave blank for an even split.
          </p>
        )}
        <div className="space-y-3">
          {products.length > 0 && multiProduct && (
            <div className={`grid ${rowGrid} gap-2 px-1`}>
              <span className="text-overline text-muted-foreground">Product name</span>
              <span className="text-overline text-muted-foreground">Stock mix %</span>
              <span className="w-9" aria-hidden />
            </div>
          )}
          {products.map((product, i) => (
            <div key={i} className={`grid ${rowGrid} gap-2 items-start`}>
              <input
                value={product.name}
                onChange={(e) => updateProduct(i, { name: e.target.value })}
                placeholder="Product name"
                className="px-3 py-2 rounded-[var(--radius-control)] border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
              />
              {multiProduct && (
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={product.stockRatio ?? ""}
                    onChange={(e) => updateProduct(i, { stockRatio: Number(e.target.value) || undefined })}
                    placeholder="e.g. 50"
                    className="w-full pl-3 pr-7 py-2 rounded-[var(--radius-control)] border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    %
                  </span>
                </div>
              )}
              <Button variant="ghost" size="icon" onClick={() => setProducts(products.filter((_, j) => j !== i))}>
                <Trash2 size={14} className="text-muted-foreground" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setProducts([...products, { name: "" }])}
          >
            <Plus size={12} /> Add product
          </Button>

          {multiProduct && anyMixSet && (
            <p
              className={`text-xs ${
                mixBalanced ? "text-success" : "text-warning"
              }`}
            >
              Stock mix totals {mixTotal}%
              {mixBalanced
                ? " — balanced."
                : ` — should add up to 100% (currently ${
                    mixTotal > 100 ? "over" : "under"
                  } by ${Math.abs(100 - mixTotal)}%).`}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Total units expected</label>
          <input
            type="number"
            value={totalUnits}
            onChange={(e) => setTotalUnits(e.target.value)}
            placeholder="e.g. 5000"
            className="w-full px-3 py-2 rounded-[var(--radius-control)] border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special preparation instructions, temperature requirements, etc."
          rows={3}
          className="w-full px-3 py-2 rounded-[var(--radius-control)] border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>
      </fieldset>

      {canEdit && (
        <div className="pt-4 border-t border-border/60">
          <Button onClick={handleSave} disabled={saving} variant="brand">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? "Saving…" : "Save product configuration"}
          </Button>
        </div>
      )}
    </Card>
  );
}
