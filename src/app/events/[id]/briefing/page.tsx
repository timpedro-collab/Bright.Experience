/**
 * Unified briefing page — creative + ops tabs.
 *
 * Both forms share the same editorial layout. The active tab is
 * driven by the `?tab=` search param so URLs are shareable and the
 * browser back button works. Creative is the default.
 */

import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";

import { CommandPalette } from "@/components/layout/CommandPalette";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { UserMenu } from "@/components/layout/UserMenu";
import {
  EditionShell,
  EditionChrome,
  EditionBody,
  EditionFooter,
  RidgeHero,
  EditorialEyebrow,
  Hairline,
} from "@/components/brand";
import { BriefingForm } from "@/components/briefing/BriefingForm";
import { OpsBriefingForm } from "@/components/briefing/OpsBriefingForm";
import { BriefingTabs } from "@/components/briefing/BriefingTabs";
import { getEventById } from "@/lib/queries/events";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function BriefingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const sp = await searchParams;
  const activeTab = sp.tab === "ops" ? "ops" : "creative";

  const [event, unread] = await Promise.all([
    getEventById(id),
    getUnreadCount(user.id),
  ]);
  if (!event) return notFound();

  const supabase = await createClient();
  const [{ data: creativeBrief }, { data: opsBrief }] = await Promise.all([
    supabase
      .from("briefing_responses")
      .select("*")
      .eq("event_id", id)
      .eq("form_type", "creative")
      .maybeSingle(),
    supabase
      .from("briefing_responses")
      .select("*")
      .eq("event_id", id)
      .eq("form_type", "ops")
      .maybeSingle(),
  ]);

  const creativeSubmitted = creativeBrief?.is_submitted ?? false;
  const opsSubmitted = opsBrief?.is_submitted ?? false;
  const bothSubmitted = creativeSubmitted && opsSubmitted;

  const heroTitle =
    activeTab === "ops"
      ? "The logistics."
      : "Tell us your story.";
  const heroSubtitle =
    activeTab === "ops"
      ? "Help our ops team plan the perfect build by sharing your venue and logistics details."
      : "A few prompts help our creative team design something that actually feels like your brand.";

  return (
    <EditionShell>
      <EditionChrome
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: event.name, href: `/events/${id}` },
          { label: "Briefing" },
        ]}
        rightSlot={
          <>
            <NotificationBell unreadCount={unread} />
            <span
              className="hidden md:block h-6 w-px bg-border"
              aria-hidden
            />
            <UserMenu user={user} />
          </>
        }
      />

      <RidgeHero
        seed={`${event.id}::briefing`}
        eyebrow={`${event.account.name} · Briefing`}
        title={heroTitle}
        subtitle={heroSubtitle}
        rightSlot={
          <div className="inline-flex items-center gap-1.5">
            <FileText className="size-3" />
            <span
              className={
                bothSubmitted
                  ? "text-success"
                  : "text-[var(--color-bb-cobalt)]"
              }
            >
              {bothSubmitted
                ? "Both submitted"
                : creativeSubmitted || opsSubmitted
                  ? "1 of 2 submitted"
                  : "In progress"}
            </span>
          </div>
        }
      />

      <EditionBody>
        <div className="pt-6 pb-2">
          <Suspense>
            <BriefingTabs />
          </Suspense>
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-[1fr_18rem] gap-x-12 gap-y-8 py-10">
          <div>
            <EditorialEyebrow accent>
              {activeTab === "ops" ? "Your logistics" : "Your brief"}
            </EditorialEyebrow>
            <p className="mt-2 text-sm text-muted-foreground max-w-[58ch]">
              {activeTab === "ops"
                ? "Fill in what you know now. We'll confirm the rest on a planning call."
                : "Answer what you can. Anything you skip we'll ask about on the kickoff call."}
            </p>
            <div className="mt-6">
              {activeTab === "ops" ? (
                <OpsBriefingForm
                  eventId={id}
                  initialResponses={opsBrief?.responses ?? {}}
                  isSubmitted={opsSubmitted}
                />
              ) : (
                <BriefingForm
                  eventId={id}
                  initialResponses={creativeBrief?.responses ?? {}}
                  isSubmitted={creativeSubmitted}
                />
              )}
            </div>
          </div>

          <aside className="space-y-8 lg:border-l lg:border-border/40 lg:pl-8">
            {activeTab === "creative" ? (
              <>
                <div>
                  <EditorialEyebrow>Why we ask</EditorialEyebrow>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    Every great experience starts with a clear point of view.
                    Your answers shape the creative direction, the copy on
                    screen, and the cues we use to surprise your audience.
                  </p>
                </div>
                <Hairline />
                <div>
                  <EditorialEyebrow>What we&apos;ll do with it</EditorialEyebrow>
                  <ul className="mt-3 flex flex-col divide-y divide-border/40 border-t border-b border-border/40">
                    {[
                      "Match your brand voice across the experience",
                      "Tune the creative to your audience and the room",
                      "Bring the right ideas to your kickoff call",
                    ].map((item, i) => (
                      <li key={i} className="flex items-baseline gap-3 py-2.5">
                        <span className="text-overline text-muted-foreground tabular-nums">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <>
                <div>
                  <EditorialEyebrow>Why this matters</EditorialEyebrow>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    Getting logistics right means a smooth build day and zero
                    surprises. The more detail you give us now, the less
                    back-and-forth later.
                  </p>
                </div>
                <Hairline />
                <div>
                  <EditorialEyebrow>What happens next</EditorialEyebrow>
                  <ul className="mt-3 flex flex-col divide-y divide-border/40 border-t border-b border-border/40">
                    {[
                      "We verify venue access and power supply",
                      "Risk assessment and H&S documentation",
                      "Logistics team confirms the delivery plan",
                    ].map((item, i) => (
                      <li key={i} className="flex items-baseline gap-3 py-2.5">
                        <span className="text-overline text-muted-foreground tabular-nums">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            <Hairline />

            <div>
              <EditorialEyebrow>Need a hand?</EditorialEyebrow>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Stuck on a question? Drop us a message and your account
                manager will jump in.
              </p>
              <Link
                href={`/events/${id}/communications`}
                className="mt-3 inline-block text-overline text-[var(--color-bb-cobalt)] underline decoration-from-font underline-offset-4 font-medium"
              >
                Message your team →
              </Link>
            </div>
          </aside>
        </section>
      </EditionBody>

      <EditionFooter
        rightSlot={
          <Link
            href={`/events/${id}`}
            className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="h-3 w-3" /> Back to {event.name}
          </Link>
        }
      />
      <CommandPalette />
    </EditionShell>
  );
}
