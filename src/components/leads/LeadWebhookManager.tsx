/** Manage HTTPS endpoints that receive leads in real time. */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import {
  createLeadWebhook,
  deleteLeadWebhook,
  toggleLeadWebhook,
} from "@/app/actions/lead-webhooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { cn } from "@/lib/utils";

export interface LeadWebhookManagerProps {
  eventId: string;
  webhooks: Array<{
    id: string;
    url: string;
    isActive: boolean;
    failureCount: number;
    lastTriggeredAt: string | null;
  }>;
}

function truncateUrlMiddle(url: string, maxLength = 52): string {
  if (url.length <= maxLength) return url;
  const keep = Math.floor((maxLength - 3) / 2);
  return `${url.slice(0, keep)}...${url.slice(-keep)}`;
}

export function LeadWebhookManager({ eventId, webhooks }: LeadWebhookManagerProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [createPending, startCreateTransition] = useTransition();
  const [togglePending, startToggleTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();

  function openForm() {
    setUrlInput("");
    setRevealedSecret(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setUrlInput("");
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    startCreateTransition(async () => {
      const result = await createLeadWebhook({
        eventId,
        url: urlInput.trim(),
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setRevealedSecret(result.data.secret);
      toast.success("Webhook endpoint added");
      router.refresh();
    });
  }

  function handleToggle(id: string, active: boolean) {
    startToggleTransition(async () => {
      const result = await toggleLeadWebhook(id, active);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(active ? "Webhook enabled" : "Webhook disabled");
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startDeleteTransition(async () => {
      const result = await deleteLeadWebhook(id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Webhook removed");
      router.refresh();
    });
  }

  async function copySecret() {
    if (!revealedSecret) return;
    try {
      await navigator.clipboard.writeText(revealedSecret);
      toast.success("Secret copied");
    } catch {
      toast.error("Could not copy — select and copy manually");
    }
  }

  const isPending = createPending || togglePending || deletePending;

  return (
    <div className="space-y-4">
      {webhooks.length === 0 && !formOpen ? (
        <p className="text-sm text-muted-foreground">
          Deliver each lead to your CRM the moment it&apos;s captured.
        </p>
      ) : null}

      {webhooks.map((webhook) => (
        <div
          key={webhook.id}
          className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-card/70 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0 space-y-1">
            <p
              className="truncate font-mono text-sm text-foreground"
              title={webhook.url}
            >
              {truncateUrlMiddle(webhook.url)}
            </p>
            <p className="text-xs text-muted-foreground">
              {webhook.lastTriggeredAt ? (
                <>
                  Last delivered <TimeAgo dateStr={webhook.lastTriggeredAt} />
                </>
              ) : (
                "Never triggered"
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {webhook.failureCount > 0 ? (
              <Badge variant="warning">
                {webhook.failureCount} failed deliver
                {webhook.failureCount === 1 ? "y" : "ies"}
              </Badge>
            ) : null}

            <Button
              variant="ghost"
              size="sm"
              type="button"
              disabled={isPending}
              onClick={() => handleToggle(webhook.id, !webhook.isActive)}
            >
              {togglePending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : null}
              {webhook.isActive ? "Disable" : "Enable"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              type="button"
              disabled={isPending}
              onClick={() => handleDelete(webhook.id)}
              aria-label={`Delete webhook ${truncateUrlMiddle(webhook.url)}`}
            >
              {deletePending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
            </Button>
          </div>
        </div>
      ))}

      {revealedSecret ? (
        <div className="space-y-2 rounded-[var(--radius-card)] border border-warning/40 bg-warning/5 p-4">
          <p className="text-sm font-medium text-foreground">
            Store this now — it won&apos;t be shown again.
          </p>
          <div className="flex items-start gap-2">
            <code
              className={cn(
                "block flex-1 overflow-x-auto rounded-md bg-muted px-3 py-2 font-mono text-xs",
              )}
            >
              {revealedSecret}
            </code>
            <Button variant="ghost" size="sm" type="button" onClick={copySecret}>
              <Copy size={14} />
              Copy
            </Button>
          </div>
        </div>
      ) : null}

      {!formOpen ? (
        <Button variant="ghost" size="sm" type="button" onClick={openForm}>
          Add endpoint
        </Button>
      ) : (
        <form
          onSubmit={handleCreate}
          className="rounded-[var(--radius-card)] border border-border bg-card/70 p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <p className="text-heading text-sm font-semibold text-foreground">
              Add endpoint
            </p>
            <Button variant="ghost" size="sm" onClick={closeForm} type="button">
              <X size={14} />
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`lead-webhook-url-${eventId}`}>HTTPS URL</Label>
            <Input
              id={`lead-webhook-url-${eventId}`}
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://crm.example.com/webhooks/brightblue"
              required
            />
          </div>

          <div className="mt-5">
            <Button variant="brand" size="sm" type="submit" disabled={createPending}>
              {createPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : null}
              Save endpoint
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
