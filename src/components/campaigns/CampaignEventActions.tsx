/**
 * Per-event row actions inside a campaign: remove the event from the
 * campaign, or duplicate it (new dates/venue) for a multi-stop rollout
 * and auto-link the copy to the same campaign.
 */
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  addEventToCampaign,
  duplicateEventForCampaign,
  removeEventFromCampaign,
} from "@/app/actions/campaigns";

export function CampaignEventActions({
  campaignId,
  eventId,
  eventName,
}: {
  campaignId: string;
  eventId: string;
  eventName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [dupeOpen, setDupeOpen] = React.useState(false);
  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");
  const [venue, setVenue] = React.useState("");

  function handleRemove() {
    startTransition(async () => {
      const res = await removeEventFromCampaign(campaignId, eventId);
      if (res.success) {
        toast.success("Removed from campaign");
        router.refresh();
      } else {
        toast.error(res.error ?? "Could not remove event");
      }
    });
  }

  function handleDuplicate() {
    if (!start || !end) {
      toast.error("Pick a start and end date");
      return;
    }
    startTransition(async () => {
      const res = await duplicateEventForCampaign(
        eventId,
        { start, end },
        venue || undefined,
      );
      if (!res.success) {
        toast.error(res.error ?? "Could not duplicate event");
        return;
      }
      const link = await addEventToCampaign(campaignId, res.data.id);
      if (!link.success) {
        toast.warning("Duplicated, but couldn't auto-link to campaign", {
          description: link.error,
        });
      } else {
        toast.success("Duplicated for rollout");
      }
      setDupeOpen(false);
      setStart("");
      setEnd("");
      setVenue("");
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={pending}
            aria-label={`Actions for ${eventName}`}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setDupeOpen(true)}>
            <Copy className="mr-2 h-4 w-4" /> Duplicate for rollout
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleRemove}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Remove from campaign
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dupeOpen} onOpenChange={setDupeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate “{eventName}”</DialogTitle>
            <DialogDescription>
              Spin up a copy for another stop on this campaign. Pick the new
              dates and (optionally) a new venue. The copy starts at the
              Confirmed stage and links to this campaign.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-overline text-muted-foreground">
                  Start date
                </span>
                <Input
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </label>
              <label className="space-y-1">
                <span className="text-overline text-muted-foreground">
                  End date
                </span>
                <Input
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </label>
            </div>
            <label className="space-y-1 block">
              <span className="text-overline text-muted-foreground">
                New venue (optional)
              </span>
              <Input
                placeholder="Leave blank to keep the original venue"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
              />
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDupeOpen(false)}>
              Cancel
            </Button>
            <Button variant="brand" onClick={handleDuplicate} disabled={pending}>
              {pending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              Duplicate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
