"use client";

/**
 * "New venue" dialog for the admin partners list — venues are created
 * internally only (never self-service), so this is where an admin registers
 * one on the estate.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { createVenue } from "@/app/actions/venues";

/** Mirrors the `venues.venue_type` check constraint. */
const VENUE_TYPES = [
  { value: "convention_centre", label: "Convention centre" },
  { value: "shopping_centre", label: "Shopping centre" },
  { value: "hotel", label: "Hotel" },
  { value: "arena", label: "Arena" },
  { value: "other", label: "Other" },
] as const;

export function NewVenueDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [venueType, setVenueType] = useState("convention_centre");
  const [capacity, setCapacity] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Enter the venue name.");
      return;
    }

    startTransition(async () => {
      const result = await createVenue({
        name: name.trim(),
        address: address.trim() || undefined,
        postcode: postcode.trim() || undefined,
        venueType,
        capacity: capacity ? Number(capacity) : undefined,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`${name.trim()} added to the estate`);
      setOpen(false);
      setName("");
      setAddress("");
      setPostcode("");
      setCapacity("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="brand" size="sm">
          <Plus size={14} />
          New venue
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New venue</DialogTitle>
          <DialogDescription>
            Register a venue on the estate. You can link it to a venue partner
            organisation afterwards.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="venue-name">Venue name</Label>
            <Input
              id="venue-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Riverside Arena"
              maxLength={200}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="venue-address">Address</Label>
              <Input
                id="venue-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="1 Riverside Way"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="venue-postcode">Postcode</Label>
              <Input
                id="venue-postcode"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="SE1 9PX"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="venue-type">Venue type</Label>
              <NativeSelect
                id="venue-type"
                value={venueType}
                onChange={(e) => setVenueType(e.target.value)}
              >
                {VENUE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="venue-capacity">Capacity</Label>
              <Input
                id="venue-capacity"
                type="number"
                min={0}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="12000"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="brand" size="sm" type="submit" disabled={pending}>
              {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Create venue
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
