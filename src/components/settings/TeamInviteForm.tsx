/** Lead-contact teammate invite — instant for same-domain, approval otherwise. */
"use client";

import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inviteTeammate } from "@/app/actions/team";

interface TeamInviteFormProps {
  /** The lead contact's own email domain (e.g. "cocacola.com"). */
  domain: string;
}

export function TeamInviteForm({ domain }: TeamInviteFormProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [asAdmin, setAsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await inviteTeammate(email, asAdmin);
      if (result.success) {
        setMessage(
          result.status === "invited"
            ? "Invite sent — they'll get an email to set their password and can log in straight away."
            : "Sent to Bright.Blue for approval (outside your company domain or admin access). You'll be notified once they're added.",
        );
        setEmail("");
        setAsAdmin(false);
      } else {
        setError(result.error);
      }
    });
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5"
      >
        <UserPlus size={14} /> Invite a teammate
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
      <Input
        type="email"
        placeholder="colleague@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={isPending}
      />
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={asAdmin}
          onChange={(e) => setAsAdmin(e.target.checked)}
          disabled={isPending}
          className="size-4 rounded border-border"
        />
        Give them admin access (manage the team & billing)
      </label>
      {domain && (
        <p className="text-overline text-muted-foreground">
          Colleagues at{" "}
          <span className="text-foreground font-medium">@{domain}</span> get
          instant access. Anyone else — or an admin invite — needs a quick
          Bright.Blue approval.
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {message && <p className="text-xs text-success">{message}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Sending…" : "Send invite"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setOpen(false);
            setError(null);
            setMessage(null);
          }}
        >
          Close
        </Button>
      </div>
    </form>
  );
}
