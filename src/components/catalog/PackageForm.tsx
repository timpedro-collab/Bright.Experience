/** Inline form for creating/editing a package in the admin catalog. */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPackage, updatePackage } from "@/app/actions/catalog-content";

interface PackageFormProps {
  pkg?: { id: string; name: string; slug: string; tier: string; base_price: number | null };
  machines: { id: string; name: string }[];
  onClose: () => void;
}

export function PackageForm({ pkg, machines, onClose }: PackageFormProps) {
  const [name, setName] = useState(pkg?.name ?? "");
  const [slug, setSlug] = useState(pkg?.slug ?? "");
  const [tier, setTier] = useState(pkg?.tier ?? "standard");
  const [machineId, setMachineId] = useState("");
  const [basePrice, setBasePrice] = useState(pkg?.base_price?.toString() ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        if (pkg) {
          await updatePackage(pkg.id, {
            name,
            tier,
            machineId: machineId || undefined,
            basePrice: basePrice ? Number(basePrice) : undefined,
          });
        } else {
          await createPackage({
            name,
            slug,
            tier,
            machineId: machineId || undefined,
            basePrice: basePrice ? Number(basePrice) : undefined,
          });
        }
        router.refresh();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border/60 bg-card/30 rounded-md p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="pkg-name">Name</Label>
          <Input id="pkg-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        {!pkg && (
          <div className="space-y-1.5">
            <Label htmlFor="pkg-slug">Slug</Label>
            <Input id="pkg-slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="pkg-tier">Tier</Label>
          <Select value={tier} onValueChange={setTier}>
            <SelectTrigger id="pkg-tier"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pkg-machine">Machine</Label>
          <Select value={machineId} onValueChange={setMachineId}>
            <SelectTrigger id="pkg-machine"><SelectValue placeholder="Optional" /></SelectTrigger>
            <SelectContent>
              {machines.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pkg-price">Base price (¢)</Label>
          <Input id="pkg-price" type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending && <Loader2 size={14} className="animate-spin" />}
          {pkg ? "Save" : "Create"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  );
}
