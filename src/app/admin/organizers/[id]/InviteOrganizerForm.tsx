"use client";

/**
 * Give one of the organizer's own people access to their portal.
 *
 * Two grades only. A show organizer is the person who decides where units
 * stand and what sponsors pay; their team can watch the same shows but not
 * sell inventory, which is the split their own org charts already use.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { inviteOrganizerUser } from "@/app/actions/organizer-admin";
import type { OrganizerUserRole } from "@/lib/validations/organizer-admin";

interface InviteOrganizerFormProps {
  partnerId: string;
}

export function InviteOrganizerForm({ partnerId }: InviteOrganizerFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrganizerUserRole>("partner_admin");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Enter the email address to invite.");
      return;
    }

    startTransition(async () => {
      const result = await inviteOrganizerUser(partnerId, email.trim(), role);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        result.data.existingUser
          ? `${email.trim()} now has access`
          : `Invitation sent to ${email.trim()}`
      );
      setEmail("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr_auto]">
      <div className="space-y-2">
        <Label htmlFor="organizer-invite-email">Email address</Label>
        <Input
          id="organizer-invite-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nadia@informa.example"
          maxLength={320}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="organizer-invite-role">Access</Label>
        <NativeSelect
          id="organizer-invite-role"
          value={role}
          onChange={(e) => setRole(e.target.value as OrganizerUserRole)}
        >
          <option value="partner_admin">Show organizer — can sell and deploy</option>
          <option value="partner_member">Show team — can view</option>
        </NativeSelect>
      </div>

      <div className="flex items-end">
        <Button variant="brand" size="sm" type="submit" disabled={pending}>
          {pending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Invite
        </Button>
      </div>
    </form>
  );
}
