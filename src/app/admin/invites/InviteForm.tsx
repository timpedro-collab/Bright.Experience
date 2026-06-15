/** Client-side invite form with toast feedback. */
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Mail, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviteCustomerUser, type InviteRole } from "@/app/actions/invites";

interface InviteFormProps {
  accounts: { id: string; name: string }[];
}

export function InviteForm({ accounts }: InviteFormProps) {
  const [email, setEmail] = useState("");
  const [accountId, setAccountId] = useState("");
  const [role, setRole] = useState<InviteRole>("customer_user");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      const result = await inviteCustomerUser(email, accountId, role);
      if (result.success) {
        toast.success(`Invitation sent to ${email}`);
        setEmail("");
        setAccountId("");
        setRole("customer_user");
      } else {
        toast.error(result.error ?? "Failed to send invitation");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="invite-email">Email address</Label>
        <div className="relative">
          <Mail
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="invite-email"
            type="email"
            required
            placeholder="customer@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="invite-account">Account</Label>
        <Select value={accountId} onValueChange={setAccountId} required>
          <SelectTrigger id="invite-account">
            <SelectValue placeholder="Choose an account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="invite-role">Role</Label>
        <Select
          value={role}
          onValueChange={(v) => setRole(v as InviteRole)}
        >
          <SelectTrigger id="invite-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="customer_admin">Customer Admin</SelectItem>
            <SelectItem value="customer_user">Customer User</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" variant="brand" disabled={isPending || !accountId}>
        <Send size={16} className="mr-2" />
        {isPending ? "Sending…" : "Send invitation"}
      </Button>
    </form>
  );
}
