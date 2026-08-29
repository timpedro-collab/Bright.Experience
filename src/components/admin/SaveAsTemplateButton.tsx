"use client";

import { useState, useTransition } from "react";
import { FileStack, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveEventAsTemplate } from "@/app/actions/templates";

export function SaveAsTemplateButton({ eventId }: { eventId: string }) {
  const [isPending, startTransition] = useTransition();
  const [showInput, setShowInput] = useState(false);
  const [name, setName] = useState("");
  const [done, setDone] = useState(false);

  const handleSave = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      const result = await saveEventAsTemplate(eventId, name.trim());
      if (result.success) {
        setDone(true);
        setShowInput(false);
        setTimeout(() => setDone(false), 4000);
      }
    });
  };

  if (done) {
    return (
      <div className="flex items-center gap-2 text-xs text-success">
        <CheckCircle2 size={14} /> Template saved
      </div>
    );
  }

  if (!showInput) {
    return (
      <Button variant="outline" size="sm" onClick={() => setShowInput(true)} className="gap-1.5 text-xs">
        <FileStack size={12} /> Save as template
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Template name…"
        className="px-2 py-1.5 text-xs bg-transparent border border-border/40 rounded outline-none focus:border-primary transition-colors"
        autoFocus
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
      />
      <Button size="sm" onClick={handleSave} disabled={isPending || !name.trim()} className="text-xs">
        {isPending ? "Saving…" : "Save"}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setShowInput(false)} className="text-xs">
        Cancel
      </Button>
    </div>
  );
}
