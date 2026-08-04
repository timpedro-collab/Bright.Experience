/**
 * Public, token-gated live metrics dashboard — headline counts only.
 *
 * No lead PII, no cost data, no telemetry feed. Refreshes server-side every
 * minute via {@link LiveShareAutoRefresh}.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Gamepad2, Hand, Target, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/reports/MetricCard";
import { LiveShareAutoRefresh } from "@/components/events/LiveShareAutoRefresh";
import { getPublicLiveSnapshot } from "@/lib/queries/public-live";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ token: string }>;
}

export default async function PublicLivePage({ params }: Props) {
  const { token } = await params;
  const snapshot = await getPublicLiveSnapshot(token);
  if (!snapshot) return notFound();

  const expiryLabel = new Date(snapshot.expiresAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-10 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
              B
            </div>
            <span className="text-heading text-sm font-semibold text-foreground">
              Bright.Experience
            </span>
          </Link>
        </div>

        <div className="mb-8 flex flex-wrap items-start gap-3">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h1 className="text-display text-3xl text-foreground md:text-4xl">
                {snapshot.eventName}
              </h1>
              {snapshot.isLive ? (
                <Badge variant="destructive" className="animate-pulse">
                  LIVE
                </Badge>
              ) : (
                <Badge variant="muted">Wrapped</Badge>
              )}
            </div>
            {snapshot.venueName && (
              <p className="text-sm text-muted-foreground">{snapshot.venueName}</p>
            )}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard
            icon={Gamepad2}
            label="Plays"
            value={snapshot.totals.plays.toLocaleString("en-US")}
          />
          <MetricCard
            icon={Hand}
            label="Interactions"
            value={snapshot.totals.interactions.toLocaleString("en-US")}
          />
          <MetricCard
            icon={Target}
            label="Leads captured"
            value={snapshot.totals.leads.toLocaleString("en-US")}
          />
          <MetricCard
            icon={Trophy}
            label="Prizes won"
            value={snapshot.totals.prizes.toLocaleString("en-US")}
          />
        </div>

        <LiveShareAutoRefresh />

        <p className="mt-4 text-center text-xs text-muted-foreground">
          View-only link · expires {expiryLabel}
        </p>

        <footer className="mt-12 border-t border-border/40 pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by{" "}
            <Link href="/" className="text-brand hover:underline">
              Bright.Experience
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
