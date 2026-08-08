/**
 * PostAcceptBanner — the personal moment after a customer accepts.
 *
 * Renders above the proposal hero when `status === 'accepted'`. The customer
 * reads their first name, what they accepted, when it happens, and the name of
 * the human picking it up. Quiet craft over loud confetti — the confetti is
 * fired client-side at the moment of the click; this is the calm post-action.
 */
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, MailCheck, Sparkles } from "lucide-react";

import { DEFAULT_ACCOUNT_MANAGER } from "@/lib/team";
import { formatDateLong } from "@/lib/dates";

interface PostAcceptBannerProps {
  contactName: string;
  /** ISO date string for the event start, if known. */
  eventDateStart?: string | null;
  /**
   * True when accepting auto-provisioned a portal and fired the invite email —
   * the banner then tells the customer to check their inbox for the
   * set-your-password link instead of leaving that promise implicit.
   */
  portalInviteSent?: boolean;
}

function firstName(full: string): string {
  return (full.trim().split(/\s+/)[0] ?? "").replace(/[.,]$/, "") || "there";
}

export function PostAcceptBanner({
  contactName,
  eventDateStart,
  portalInviteSent = false,
}: PostAcceptBannerProps) {
  const ae = DEFAULT_ACCOUNT_MANAGER;
  const first = firstName(contactName);

  return (
    <Card
      tone="elevated"
      className="no-print relative mb-10 overflow-hidden border-primary/25 bg-primary/[0.06]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl"
      />
      <CardContent className="relative space-y-5 p-6 md:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/[0.08] px-3 py-1">
          <Sparkles size={12} className="text-primary" />
          <span className="text-overline text-primary">Make your moment count</span>
        </div>
        <div>
          <h2 className="text-display text-3xl font-bold text-foreground md:text-4xl">
            {eventDateStart
              ? `${first}, your Experience Portal is locked in for ${formatDateLong(eventDateStart)}.`
              : `${first}, your Experience Portal is locked in.`}
          </h2>
          <p className="mt-3 text-muted-foreground md:text-lg">
            {ae.firstName}&apos;s working on your kickoff — you&apos;ll hear from{" "}
            {ae.firstName} within the hour.
          </p>
        </div>
        {portalInviteSent && (
          <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/[0.05] px-4 py-3 text-sm text-foreground">
            <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span>
              Your portal invite is on its way — check your inbox for an email
              to set your password.
            </span>
          </div>
        )}
        {eventDateStart && (
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4 text-primary" aria-hidden />
            Event date · {formatDateLong(eventDateStart)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
