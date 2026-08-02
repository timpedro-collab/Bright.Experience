/**
 * The "yes" on the sponsor pitch page.
 *
 * Everything above this on the page is the case for the slot; this is the only
 * thing on it that moves. Kept to the three fields the organizer needs to pick
 * up the conversation — a sponsor who has already read the pitch shouldn't be
 * made to fill in a form to say they're interested.
 */
"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { expressSponsorInterest } from "@/app/actions/sponsor-pitch";

export function SponsorInterestForm({
  token,
  sponsorName,
  showName,
}: {
  token: string;
  /** Pre-fills the company when the slot was pitched to a named sponsor. */
  sponsorName?: string | null;
  showName: string;
}) {
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState(sponsorName ?? "");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await expressSponsorInterest({
        token,
        contactName: contactName.trim(),
        email: email.trim(),
        company: company.trim() || undefined,
        message: message.trim() || undefined,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }
      setSent(true);
    });
  }

  if (sent) {
    return (
      <Card>
        <CardContent className="flex items-start gap-3 p-6">
          <CheckCircle2 className="mt-0.5 shrink-0 text-success" size={20} />
          <div>
            <p className="text-sm font-medium text-foreground">
              We&apos;ve held the slot for you.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              The team running {showName} has been notified and will confirm
              the details with you directly.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-heading text-sm font-semibold text-foreground">
          Interested in this slot?
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us where to reply and we&apos;ll hold it while you decide.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="sponsor-contact-name"
                className="text-xs font-medium text-muted-foreground"
              >
                Your name
              </label>
              <Input
                id="sponsor-contact-name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
                minLength={2}
                maxLength={120}
                autoComplete="name"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="sponsor-email"
                className="text-xs font-medium text-muted-foreground"
              >
                Email
              </label>
              <Input
                id="sponsor-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={320}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="sponsor-company"
              className="text-xs font-medium text-muted-foreground"
            >
              Company
            </label>
            <Input
              id="sponsor-company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              maxLength={160}
              autoComplete="organization"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="sponsor-message"
              className="text-xs font-medium text-muted-foreground"
            >
              Anything you&apos;d like to ask (optional)
            </label>
            <textarea
              id="sponsor-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={1000}
              className="w-full resize-none rounded-[var(--radius-control)] border border-border bg-muted/40 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              placeholder="Dates, artwork, anything else."
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" variant="brand" disabled={pending}>
            <Send size={14} />
            {pending ? "Sending…" : "Request this slot"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
