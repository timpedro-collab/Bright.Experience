"use client";

/**
 * The internal-only "Send reminder" affordance for a customer-owned task.
 *
 * Internal users never complete customer work from their own action list —
 * the single thing they can do is nudge the customer. This button calls
 * `remindCustomerTask`, which fires the matching customer notification
 * (in-portal + email) deep-linked to where the work gets done.
 */

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { remindCustomerTask } from "@/app/actions/tasks";

export function RemindCustomerButton({
  taskId,
  overdue = false,
}: {
  taskId: string;
  overdue?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      const result = await remindCustomerTask(taskId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Reminder sent to the customer.");
      router.refresh();
    });
  }

  return (
    <Button
      variant={overdue ? "outline" : "ghost"}
      size="sm"
      className="h-7 shrink-0 text-xs"
      onClick={handleClick}
      disabled={pending}
    >
      {pending ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <BellRing size={12} />
      )}
      Send reminder
    </Button>
  );
}
