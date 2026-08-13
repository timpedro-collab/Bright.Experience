"use client";

/**
 * Marks the viewer's message notifications for this event as read when the
 * Messages thread mounts, then refreshes so the tab badge and bell clear.
 * Renders nothing.
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { markEventMessagesRead } from "@/app/actions/notifications";

export function MarkThreadRead({ eventId }: { eventId: string }) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    void markEventMessagesRead(eventId).then((result) => {
      if (!cancelled && result.success) router.refresh();
    });
    return () => {
      cancelled = true;
    };
  }, [eventId, router]);

  return null;
}
