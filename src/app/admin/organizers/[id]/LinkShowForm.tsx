"use client";

/**
 * Hand a show to an organizer.
 *
 * Only shows nobody has claimed are offered — moving one between organizers
 * goes through an explicit unlink, so sponsor inventory never changes hands by
 * accident on a dropdown.
 */

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { linkShowToOrganizer } from "@/app/actions/organizer-admin";
import { formatDateShort } from "@/lib/dates";
import type { LinkableShow } from "@/lib/queries/organizer-admin";

interface LinkShowFormProps {
  partnerId: string;
  shows: LinkableShow[];
}

export function LinkShowForm({ partnerId, shows }: LinkShowFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [eventId, setEventId] = useState("");

  if (shows.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Every show is already assigned to an organizer.{" "}
        <Link
          href="/events/new"
          className="underline decoration-dotted underline-offset-4 hover:text-foreground"
        >
          Create a show
        </Link>{" "}
        first, or unlink one from whoever holds it.
      </p>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!eventId) {
      toast.error("Pick which show to hand over.");
      return;
    }

    startTransition(async () => {
      const result = await linkShowToOrganizer(eventId, partnerId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Show linked");
      setEventId("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
      <div className="space-y-2">
        <Label htmlFor="link-show">Unassigned shows</Label>
        <NativeSelect
          id="link-show"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
        >
          <option value="">Choose a show</option>
          {shows.map((show) => (
            <option key={show.id} value={show.id}>
              {show.name} · {formatDateShort(show.eventDateStart)}
              {show.venueName ? ` · ${show.venueName}` : ""}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="flex items-end">
        <Button variant="brand" size="sm" type="submit" disabled={pending}>
          {pending ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
          Link show
        </Button>
      </div>
    </form>
  );
}
