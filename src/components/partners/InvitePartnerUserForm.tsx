"use client";

/**
 * Give one of a partner's own people access to their portal — by email, for
 * any partner type. Replaces the old paste-a-profile-UUID form on the admin
 * partner detail page.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { invitePartnerUser } from "@/app/actions/partner-admin";
import type { PartnerUserRole } from "@/lib/validations/partners";

interface InvitePartnerUserFormProps {
  partnerId: string;
}

export function InvitePartnerUserForm({ partnerId }: InvitePartnerUserFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<PartnerUserRole>("partner_admin");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Enter the email address to invite.");
      return;
    }

    startTransition(async () => {
      const result = await invitePartnerUser(partnerId, email.trim(), role);
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
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="partner-invite-email">Email address</Label>
        <Input
          id="partner-invite-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="dana@partner.example"
          maxLength={320}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="partner-invite-role">Access</Label>
        <NativeSelect
          id="partner-invite-role"
          value={role}
          onChange={(e) => setRole(e.target.value as PartnerUserRole)}
        >
          <option value="partner_admin">Partner admin — can manage</option>
          <option value="partner_member">Team member — can view</option>
        </NativeSelect>
      </div>

      <Button variant="brand" size="sm" type="submit" disabled={pending} className="w-full">
        {pending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        Invite
      </Button>
    </form>
  );
}
