/** Client button that calls the duplicateEvent action and redirects to the new copy. */
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { duplicateEvent } from "@/app/actions/events";

interface DuplicateEventButtonProps {
  eventId: string;
}

export function DuplicateEventButton({ eventId }: DuplicateEventButtonProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      const result = await duplicateEvent(eventId);
      if (result.success) {
        router.push(`/events/${result.data.id}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button
      variant="brand"
      size="sm"
      disabled={pending}
      onClick={handleClick}
    >
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}
      {pending ? "Duplicating…" : "Duplicate event"}
    </Button>
  );
}
