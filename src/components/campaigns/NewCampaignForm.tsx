/** Client form for creating a new campaign wired to the createCampaign action. */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCampaign } from "@/app/actions/campaigns";

export function NewCampaignForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("draft");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await createCampaign({
        name,
        description: description || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      router.push(`/admin/campaigns/${res.data.id}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="camp-name">Campaign name</Label>
        <Input
          id="camp-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Summer Festival Tour 2026"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="camp-desc">Description</Label>
        <Textarea
          id="camp-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief overview of the campaign goals…"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="camp-start">Start date</Label>
          <Input
            id="camp-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="camp-end">End date</Label>
          <Input
            id="camp-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="camp-status">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="camp-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 size={14} className="animate-spin" />}
          Create campaign
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/campaigns")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
