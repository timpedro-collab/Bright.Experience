"use client";

import { useState, useTransition } from "react";
import { Save, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { updateProfileName } from "@/app/actions/profile";

interface Props {
  initialName: string;
  email: string;
}

export function ProfileForm({ initialName, email }: Props) {
  const [name, setName] = useState(initialName);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaved(false);
    startTransition(async () => {
      try {
        await updateProfileName(name.trim());
        setSaved(true);
        toast.success("Profile updated");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to save profile"
        );
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="profile-name"
          className="block text-sm font-medium text-foreground mb-1.5"
        >
          Display name
        </label>
        <input
          id="profile-name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          placeholder="Your full name"
          className="w-full px-4 py-2.5 rounded-[var(--radius-control)] border border-white/[0.08] bg-white/[0.02] text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Email
        </label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full px-4 py-2.5 rounded-[var(--radius-control)] border border-white/[0.06] bg-white/[0.01] text-sm text-muted-foreground cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Managed by your authentication provider.
        </p>
      </div>

      <Button type="submit" variant="brand" disabled={pending || !name.trim()}>
        {pending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : saved ? (
          <CheckCircle2 size={14} className="text-success" />
        ) : (
          <Save size={14} />
        )}
        {pending ? "Saving…" : saved ? "Saved" : "Save changes"}
      </Button>
    </form>
  );
}
