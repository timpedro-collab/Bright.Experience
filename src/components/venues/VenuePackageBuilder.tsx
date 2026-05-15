/** Form to create and manage venue event packages. */
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface VenuePackageBuilderProps {
  venueId: string;
  existingPackages: Array<Record<string, unknown>>;
}

export function VenuePackageBuilder({
  venueId,
  existingPackages,
}: VenuePackageBuilderProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [includesBrightBlue, setIncludesBrightBlue] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: wire to server action createVenuePackage
    setShowForm(false);
    setName("");
    setDescription("");
    setPrice("");
    setIncludesBrightBlue(false);
  }

  return (
    <div className="space-y-4">
      {existingPackages.map((pkg) => (
        <Card key={pkg.id as string}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/40">
                  <Package size={16} className="text-brand" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {pkg.name as string}
                  </p>
                  {pkg.description ? (
                    <p className="text-xs text-muted-foreground">
                      {pkg.description as string}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pkg.includes_bright_blue ? (
                  <Badge variant="outline" className="text-xs text-brand">
                    Bright.Blue
                  </Badge>
                ) : null}
                {pkg.price != null ? (
                  <span className="text-sm font-semibold text-foreground">
                    £{Number(pkg.price).toLocaleString()}
                  </span>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Package</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pkg-name">Package Name</Label>
                <Input
                  id="pkg-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Premium Event Package"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pkg-desc">Description</Label>
                <Input
                  id="pkg-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's included in this package"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pkg-price">Price (£)</Label>
                <Input
                  id="pkg-price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>

              <button
                type="button"
                onClick={() => setIncludesBrightBlue(!includesBrightBlue)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                  includesBrightBlue
                    ? "border-brand/40 bg-brand/10 text-brand"
                    : "border-white/10 text-muted-foreground hover:border-white/20"
                )}
              >
                <div
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded border",
                    includesBrightBlue
                      ? "border-brand bg-brand"
                      : "border-white/20"
                  )}
                >
                  {includesBrightBlue && (
                    <Check size={10} className="text-white" />
                  )}
                </div>
                Includes Bright.Blue Machine
              </button>

              <input type="hidden" name="venueId" value={venueId} />

              <div className="flex gap-2">
                <Button type="submit" size="sm">
                  Create Package
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(true)}
          className="gap-2"
        >
          <Plus size={14} />
          Add Package
        </Button>
      )}
    </div>
  );
}
