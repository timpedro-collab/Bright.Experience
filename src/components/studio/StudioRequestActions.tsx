"use client";

import { useState } from "react";
import {
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  Truck,
  FileText,
  ThumbsUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { updateStudioRequestStatus } from "@/app/actions/studio";

type AllowedStatus =
  | "quoted"
  | "approved"
  | "confirmed"
  | "in_progress"
  | "delivered"
  | "cancelled";

type ButtonVariant = React.ComponentProps<typeof Button>["variant"];

interface TransitionAction {
  label: string;
  status: AllowedStatus;
  Icon: React.ElementType;
  variant: ButtonVariant;
  /**
   * When true, the button shows in a destructive tone via the `ghost`
   * variant + `text-destructive`. We don't use the full `destructive`
   * variant (red fill) because these are secondary actions next to a
   * primary "confirm" — soft red text reads as "available but cautious".
   */
  destructive?: boolean;
}

const TRANSITIONS: Record<string, TransitionAction[]> = {
  submitted: [
    { label: "Send Quote", status: "quoted", Icon: FileText, variant: "brand" },
    { label: "Confirm Order", status: "confirmed", Icon: CheckCircle2, variant: "outline" },
    { label: "Decline", status: "cancelled", Icon: XCircle, variant: "ghost", destructive: true },
  ],
  quoted: [
    { label: "Mark Approved", status: "approved", Icon: ThumbsUp, variant: "brand" },
    { label: "Cancel", status: "cancelled", Icon: XCircle, variant: "ghost", destructive: true },
  ],
  approved: [
    { label: "Start Work", status: "in_progress", Icon: Play, variant: "brand" },
    { label: "Cancel", status: "cancelled", Icon: XCircle, variant: "ghost", destructive: true },
  ],
  confirmed: [
    { label: "Start Work", status: "in_progress", Icon: Play, variant: "brand" },
    { label: "Cancel", status: "cancelled", Icon: XCircle, variant: "ghost", destructive: true },
  ],
  in_progress: [
    { label: "Mark Delivered", status: "delivered", Icon: Truck, variant: "brand" },
  ],
};

export function StudioRequestActions({
  requestId,
  eventId,
  currentStatus,
}: {
  requestId: string;
  eventId: string;
  currentStatus: string;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [price, setPrice] = useState("");
  const [days, setDays] = useState("");

  const actions = TRANSITIONS[currentStatus];
  if (!actions || actions.length === 0) return null;

  async function handleAction(status: AllowedStatus) {
    // Sending a quote needs a figure — open the inline quote form instead.
    if (status === "quoted") {
      setQuoting(true);
      return;
    }
    setLoading(status);
    await updateStudioRequestStatus(requestId, eventId, status);
    setLoading(null);
  }

  async function submitQuote() {
    const quotedCost = parseFloat(price);
    if (!Number.isFinite(quotedCost) || quotedCost <= 0) return;
    const quotedDays = parseInt(days, 10);
    setLoading("quoted");
    await updateStudioRequestStatus(requestId, eventId, "quoted", {
      quotedCost,
      quotedDays: Number.isFinite(quotedDays) && quotedDays > 0 ? quotedDays : undefined,
    });
    setLoading(null);
    setQuoting(false);
    setPrice("");
    setDays("");
  }

  if (quoting) {
    return (
      <div className="mt-3 pt-3 border-t border-border/60 flex flex-col gap-2">
        <p className="text-overline text-muted-foreground">Send a quote</p>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              $
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              autoFocus
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Price"
              className="w-full rounded-md border border-border bg-background py-1.5 pl-6 pr-2 text-xs text-foreground focus:border-[var(--color-bb-cobalt)] focus:outline-none"
            />
          </div>
          <input
            type="number"
            min="0"
            step="1"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            placeholder="Days"
            className="w-20 rounded-md border border-border bg-background py-1.5 px-2 text-xs text-foreground focus:border-[var(--color-bb-cobalt)] focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={submitQuote}
            disabled={loading !== null || !price}
            variant="brand"
            size="sm"
            className="flex-1 text-xs"
          >
            {loading === "quoted" ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <FileText size={13} />
            )}
            Send Quote
          </Button>
          <Button
            onClick={() => setQuoting(false)}
            disabled={loading !== null}
            variant="ghost"
            size="sm"
            className="text-xs"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/60">
      {actions.map((action) => (
        <Button
          key={action.status}
          onClick={() => handleAction(action.status)}
          disabled={loading !== null}
          variant={action.variant}
          size="sm"
          className={`flex-1 text-xs ${action.destructive ? "text-destructive hover:text-destructive" : ""}`}
        >
          {loading === action.status ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <action.Icon size={13} />
          )}
          {action.label}
        </Button>
      ))}
    </div>
  );
}
