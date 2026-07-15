/** Orchestrator control to move an internal task to a different team lane. */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { reassignTask } from "@/app/actions/tasks";
import { REASSIGNABLE_CATEGORIES } from "@/lib/validations/tasks";
import { OWNER_TEAM_DISPLAY_LABEL } from "@/lib/ownership";
import type { TaskCategory } from "@/types";

interface ReassignTaskMenuProps {
  taskId: string;
  currentCategory: TaskCategory;
}

export function ReassignTaskMenu({ taskId, currentCategory }: ReassignTaskMenuProps) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function handleReassign(category: (typeof REASSIGNABLE_CATEGORIES)[number]) {
    startTransition(async () => {
      const result = await reassignTask({ taskId, category });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`Moved to ${OWNER_TEAM_DISPLAY_LABEL[category]}`);
      router.refresh();
    });
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground"
          disabled={pending}
        >
          {pending ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <UserPlus size={12} />
          )}{" "}
          Reassign
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Move to team
        </DropdownMenuLabel>
        {REASSIGNABLE_CATEGORIES.map((category) => (
          <DropdownMenuItem
            key={category}
            disabled={category === currentCategory}
            onSelect={() => handleReassign(category)}
            className="cursor-pointer text-xs"
          >
            {category === currentCategory && <Check size={12} />}
            {OWNER_TEAM_DISPLAY_LABEL[category]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
