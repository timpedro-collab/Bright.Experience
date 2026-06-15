/** Client component for managing API keys with create/revoke functionality. */
"use client";

import { useState } from "react";
import { Key, Copy, Trash2, Plus, AlertTriangle } from "lucide-react";
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
import { createApiKey, revokeApiKey } from "@/app/actions/api-management";

interface ApiKeyRow {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt?: string;
  createdAt: string;
}

interface ApiKeyManagerProps {
  keys: ApiKeyRow[];
}

export function ApiKeyManager({ keys }: ApiKeyManagerProps) {
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!newKeyName.trim()) return;
    setLoading(true);
    const result = await createApiKey({
      name: newKeyName.trim(),
      permissions: ["read"],
    });
    setLoading(false);
    if (result.success) {
      setGeneratedKey(result.data.key);
      setNewKeyName("");
    }
  }

  async function handleRevoke(id: string) {
    await revokeApiKey(id);
  }

  function handleCopy() {
    if (generatedKey) navigator.clipboard.writeText(generatedKey);
  }

  function handleDialogClose(open: boolean) {
    if (!open) {
      setGeneratedKey(null);
      setNewKeyName("");
    }
    setDialogOpen(open);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-heading text-base font-semibold text-foreground">
          API Keys
        </h3>
        <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus size={16} className="mr-1.5" />
              Create Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {generatedKey ? "Key Created" : "Create API Key"}
              </DialogTitle>
              <DialogDescription>
                {generatedKey
                  ? "Copy this key now — it cannot be shown again."
                  : "Give your API key a descriptive name."}
              </DialogDescription>
            </DialogHeader>

            {generatedKey ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
                  <AlertTriangle size={16} className="text-warning shrink-0" />
                  <span className="text-xs text-muted-foreground">
                    Store this key securely. It will not be shown again.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-lg bg-muted p-3 text-xs font-mono text-foreground break-all">
                    {generatedKey}
                  </code>
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy size={14} />
                  </Button>
                </div>
              </div>
            ) : (
              <Input
                placeholder="e.g. Production API Key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            )}

            <DialogFooter>
              {generatedKey ? (
                <Button onClick={() => handleDialogClose(false)}>Done</Button>
              ) : (
                <Button onClick={handleCreate} disabled={loading || !newKeyName.trim()}>
                  {loading ? "Creating…" : "Create"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {keys.length === 0 ? (
        <div className="text-center py-8">
          <Key size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No API keys yet.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((k) => (
              <TableRow key={k.id}>
                <TableCell className="font-medium text-foreground">
                  {k.name}
                </TableCell>
                <TableCell>
                  <code className="text-xs text-muted-foreground font-mono">
                    {k.keyPrefix}…
                  </code>
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn(
                      "border-0 text-xs",
                      k.isActive
                        ? "bg-success/20 text-success"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {k.isActive ? "Active" : "Revoked"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {k.lastUsedAt ?? "Never"}
                </TableCell>
                <TableCell>
                  {k.isActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevoke(k.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
