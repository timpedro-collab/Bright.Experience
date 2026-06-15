/** Campaign picker — lets an internal user link the current event to an existing campaign. */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addEventToCampaign } from "@/app/actions/campaigns";

interface Campaign {
  id: string;
  name: string;
  status: string;
}

interface AddToCampaignPickerProps {
  eventId: string;
  campaigns: Campaign[];
  linkedCampaignIds: string[];
}

export function AddToCampaignPicker({
  eventId,
  campaigns,
  linkedCampaignIds,
}: AddToCampaignPickerProps) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<"idle" | "success" | "error">("idle");
  const router = useRouter();

  const available = campaigns.filter((c) => !linkedCampaignIds.includes(c.id));

  if (available.length === 0) return null;

  function handleAdd() {
    if (!selectedId) return;
    setResult("idle");
    startTransition(async () => {
      const res = await addEventToCampaign(selectedId, eventId);
      if (res.success) {
        setResult("success");
        setSelectedId("");
        router.refresh();
        setTimeout(() => setResult("idle"), 2000);
      } else {
        setResult("error");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedId} onValueChange={setSelectedId}>
        <SelectTrigger className="w-[220px] h-8 text-sm">
          <SelectValue placeholder="Choose campaign…" />
        </SelectTrigger>
        <SelectContent>
          {available.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        disabled={!selectedId || pending}
        onClick={handleAdd}
      >
        {pending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : result === "success" ? (
          <Check size={14} />
        ) : (
          <Plus size={14} />
        )}
        {pending ? "Adding…" : result === "success" ? "Added" : "Add"}
      </Button>

      {result === "error" && (
        <span className="text-xs text-destructive">
          Failed — event may already be linked.
        </span>
      )}
    </div>
  );
}
