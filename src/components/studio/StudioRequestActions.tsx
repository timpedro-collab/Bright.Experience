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

  const actions = TRANSITIONS[currentStatus];
  if (!actions || actions.length === 0) return null;

  async function handleAction(status: AllowedStatus) {
    setLoading(status);
    await updateStudioRequestStatus(requestId, eventId, status);
    setLoading(null);
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
