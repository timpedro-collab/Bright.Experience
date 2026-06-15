"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { saveProductConfiguration, type ProductConfiguration } from "@/app/actions/game-config";

interface ProductConfigFormProps {
  eventId: string;
  config: ProductConfiguration | null;
}

type Product = ProductConfiguration["productsJson"][number];

export function ProductConfigForm({ eventId, config }: ProductConfigFormProps) {
  const router = useRouter();
  const [saving, startSave] = useTransition();

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

  return (
    <Card tone="subtle" className="p-6 space-y-6">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Products</label>
        <div className="space-y-3">
          {products.map((product, i) => (
            <div key={i} className="grid grid-cols-[1fr_80px_1fr_auto] gap-2 items-start">
              <input
                value={product.name}
                onChange={(e) => updateProduct(i, { name: e.target.value })}
                placeholder="Product name"
                className="px-3 py-2 rounded-[var(--radius-control)] border border-white/[0.08] bg-white/[0.02] text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="number"
                value={product.stockRatio ?? ""}
                onChange={(e) => updateProduct(i, { stockRatio: Number(e.target.value) || undefined })}
                placeholder="Ratio %"
                className="px-3 py-2 rounded-[var(--radius-control)] border border-white/[0.08] bg-white/[0.02] text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                value={product.preparationNotes ?? ""}
                onChange={(e) => updateProduct(i, { preparationNotes: e.target.value })}
                placeholder="Preparation notes"
                className="px-3 py-2 rounded-[var(--radius-control)] border border-white/[0.08] bg-white/[0.02] text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
              />
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
            className="w-full px-3 py-2 rounded-[var(--radius-control)] border border-white/[0.08] bg-white/[0.02] text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
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
          className="w-full px-3 py-2 rounded-[var(--radius-control)] border border-white/[0.08] bg-white/[0.02] text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      <div className="pt-4 border-t border-white/[0.06]">
        <Button onClick={handleSave} disabled={saving} variant="brand">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Saving…" : "Save product configuration"}
        </Button>
      </div>
    </Card>
  );
}
