/**
 * Light identity gate in front of the pitch page's detailed numbers.
 * Viewing the pitch stays free; the expected/actual performance figures
 * unlock in exchange for a name and work email (the DocSend dynamic —
 * delayed but perfectly-targeted follow-up).
 */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LockOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { unlockPitchDetails } from "@/app/actions/sponsor-pitch";

export function PitchDetailGate({
  token,
  sponsorName,
}: {
  token: string;
  /** Pre-fills the company when the slot was pitched to a named sponsor. */
  sponsorName?: string | null;
}) {
  const router = useRouter();
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState(sponsorName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await unlockPitchDetails({
        token,
        contactName: contactName.trim(),
        email: email.trim(),
        company: company.trim() || undefined,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      // The unlock cookie is set server-side; refresh renders the numbers.
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <LockOpen size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              See the detailed numbers
            </p>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              Tell us who&apos;s reading and the performance figures unlock —
              no call, no obligation.
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Your name"
              aria-label="Your name"
              required
            />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Work email"
              aria-label="Work email"
              required
            />
          </div>
          <Input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company (optional)"
            aria-label="Company"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" variant="brand" disabled={pending}>
            {pending ? "Unlocking…" : "Unlock the numbers"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
