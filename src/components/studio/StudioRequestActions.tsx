"use client";

import { useState } from "react";
import {
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  Truck,
} from "lucide-react";
import { updateStudioRequestStatus } from "@/app/actions/studio";

type AllowedStatus = "confirmed" | "in_progress" | "delivered" | "cancelled";

const TRANSITIONS: Record<
  string,
  { label: string; status: AllowedStatus; Icon: React.ElementType; style: string }[]
> = {
  submitted: [
    {
      label: "Confirm Order",
      status: "confirmed",
      Icon: CheckCircle2,
      style: "btn btn-primary",
    },
    {
      label: "Decline",
      status: "cancelled",
      Icon: XCircle,
      style: "btn btn-ghost text-destructive",
    },
  ],
  confirmed: [
    {
      label: "Start Work",
      status: "in_progress",
      Icon: Play,
      style: "btn btn-primary",
    },
    {
      label: "Cancel",
      status: "cancelled",
      Icon: XCircle,
      style: "btn btn-ghost text-destructive",
    },
  ],
  in_progress: [
    {
      label: "Mark Delivered",
      status: "delivered",
      Icon: Truck,
      style: "btn btn-primary",
    },
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
    try {
      await updateStudioRequestStatus(requestId, eventId, status);
    } catch {
      // Error handling
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.06]">
      {actions.map((action) => (
        <button
          key={action.status}
          onClick={() => handleAction(action.status)}
          disabled={loading !== null}
          className={`${action.style} text-xs flex-1 disabled:opacity-50`}
        >
          {loading === action.status ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <action.Icon size={13} />
          )}
          {action.label}
        </button>
      ))}
    </div>
  );
}
