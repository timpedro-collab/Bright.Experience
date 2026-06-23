/** Client control to move a campaign through its lifecycle status. */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { updateCampaignStatus } from "@/app/actions/campaigns";

const STATUSES: { value: string; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

export function CampaignStatusControl({
  campaignId,
  status,
}: {
  campaignId: string;
  status: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [current, setCurrent] = useState(status);
  const [error, setError] = useState<string | null>(null);

  function handleChange(next: string) {
    if (next === current || isPending) return;
    setError(null);
    startTransition(async () => {
      const result = await updateCampaignStatus(campaignId, next);
      if (result.success) {
        setCurrent(next);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Campaign status
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Move this campaign through its lifecycle as it launches and wraps.
          </p>
          {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => {
            const isActive = s.value === current;
            return (
              <Button
                key={s.value}
                size="sm"
                variant={isActive ? "default" : "outline"}
                disabled={isPending}
                onClick={() => handleChange(s.value)}
                className={cn("gap-1.5 text-xs", !isActive && "text-muted-foreground")}
              >
                {isActive && <Check size={12} />}
                {s.label}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
