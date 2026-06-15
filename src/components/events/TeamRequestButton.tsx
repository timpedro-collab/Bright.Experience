/** Inline form for customers to request a new team member. */
"use client";

import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestTeamMember } from "@/app/actions/team";

interface TeamRequestButtonProps {
  eventId: string;
}

export function TeamRequestButton({ eventId }: TeamRequestButtonProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [roleLabel, setRoleLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await requestTeamMember(
        eventId,
        email,
        roleLabel || "Team Member",
      );
      if (result.success) {
        setSuccess(true);
        setEmail("");
        setRoleLabel("");
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
        }, 2000);
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
        <UserPlus size={14} /> Request a team member
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Input
        type="email"
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={isPending}
      />
      <Input
        type="text"
        placeholder="Role (optional)"
        value={roleLabel}
        onChange={(e) => setRoleLabel(e.target.value)}
        disabled={isPending}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      {success && (
        <p className="text-xs text-success">Request sent for approval.</p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Sending…" : "Request"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
