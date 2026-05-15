/** Client component for managing webhook subscriptions. */
"use client";

import { useState } from "react";
import { Webhook, Plus, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  createWebhookSubscription,
  deleteWebhookSubscription,
} from "@/app/actions/api-management";

interface WebhookRow {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  failureCount: number;
}

interface WebhookManagerProps {
  subscriptions: WebhookRow[];
}

const AVAILABLE_EVENTS = [
  "event.created",
  "event.stage_changed",
  "event.completed",
  "lead.captured",
  "report.published",
];

export function WebhookManager({ subscriptions }: WebhookManagerProps) {
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  function toggleEvent(evt: string) {
    setSelectedEvents((prev) =>
      prev.includes(evt) ? prev.filter((e) => e !== evt) : [...prev, evt]
    );
  }

  async function handleCreate() {
    if (!url.trim() || selectedEvents.length === 0) return;
    setLoading(true);
    const result = await createWebhookSubscription({
      url: url.trim(),
      events: selectedEvents,
    });
    setLoading(false);
    if (result.success) {
      setUrl("");
      setSelectedEvents([]);
      setDialogOpen(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteWebhookSubscription(id);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-heading text-base font-semibold text-text-primary">
          Webhooks
        </h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus size={16} className="mr-1.5" />
              Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Webhook Subscription</DialogTitle>
              <DialogDescription>
                Receive HTTP POST notifications for event lifecycle changes.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-text-secondary mb-1.5 block">
                  Endpoint URL
                </label>
                <Input
                  placeholder="https://your-app.com/webhooks"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-text-secondary mb-2 block">
                  Event Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_EVENTS.map((evt) => (
                    <button
                      key={evt}
                      type="button"
                      onClick={() => toggleEvent(evt)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                        selectedEvents.includes(evt)
                          ? "bg-brand/20 text-brand border-brand/30"
                          : "bg-muted text-muted-foreground border-transparent hover:border-white/10"
                      )}
                    >
                      {evt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={handleCreate}
                disabled={loading || !url.trim() || selectedEvents.length === 0}
              >
                {loading ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {subscriptions.length === 0 ? (
        <div className="text-center py-8">
          <Webhook size={32} className="mx-auto text-text-muted mb-3" />
          <p className="text-sm text-text-muted">No webhook subscriptions yet.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Endpoint</TableHead>
              <TableHead>Events</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((wh) => (
              <TableRow key={wh.id}>
                <TableCell>
                  <code className="text-xs text-text-primary font-mono break-all">
                    {wh.url}
                  </code>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {wh.events.map((evt) => (
                      <Badge
                        key={evt}
                        className="border-0 bg-muted text-muted-foreground text-[0.65rem]"
                      >
                        {evt}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      className={cn(
                        "border-0 text-xs",
                        wh.isActive
                          ? "bg-success/20 text-success"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {wh.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {wh.failureCount > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-warning">
                        <AlertCircle size={12} />
                        {wh.failureCount}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(wh.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
