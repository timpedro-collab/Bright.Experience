/**
 * Unified briefing page — creative + ops tabs.
 * Uses EventPageShell for consistent chrome.
 */

import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { FileText } from "lucide-react";

import { EventPageShell } from "@/components/brand/event-page-shell";
import { EditorialEyebrow, Hairline } from "@/components/brand";
import { BriefingForm } from "@/components/briefing/BriefingForm";
import { OpsBriefingForm } from "@/components/briefing/OpsBriefingForm";
import { BriefingTabs } from "@/components/briefing/BriefingTabs";
import { BriefingSidebar } from "@/components/briefing/BriefingSidebar";
import { BriefingFileUpload } from "@/components/briefing/BriefingFileUpload";
import { getEventById } from "@/lib/queries/events";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { canViewSection } from "@/lib/event-access";
import { createClient } from "@/lib/supabase/server";
import { getBriefingFiles } from "@/app/actions/briefing";

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
  if (!canViewSection(user.role, "briefing")) redirect(`/events/${id}`);
  const sp = await searchParams;
  const activeTab = sp.tab === "ops" ? "ops" : "creative";

  const [event, unread, briefingFiles] = await Promise.all([
    getEventById(id),
    getUnreadCount(user.id),
    getBriefingFiles(id),
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
  const isInternal = isInternalRole(user.role);
  const accountName = event.account.name;

  const heroTitle = isInternal
    ? activeTab === "ops"
      ? "Logistics brief."
      : "Creative brief."
    : activeTab === "ops"
      ? "The logistics."
      : "Tell us your story.";
  const heroSubtitle = isInternal
    ? activeTab === "ops"
      ? `Venue and logistics details ${accountName} has shared for the build.`
      : `What ${accountName} told us about their brand and goals — use this to guide the creative.`
    : activeTab === "ops"
      ? "Help our ops team plan the perfect build by sharing your venue and logistics details."
      : "A few prompts help our creative team design something that actually feels like your brand.";

  const statusLabel = bothSubmitted
    ? "Both submitted"
    : creativeSubmitted || opsSubmitted
      ? "1 of 2 submitted"
      : "In progress";

  return (
    <EventPageShell
      event={event}
      user={user}
      unreadCount={unread}
      section="Briefing"
      eyebrow={`${event.account.name} · Briefing`}
      title={heroTitle}
      subtitle={heroSubtitle}
      isInternal={isInternal}
      heroRight={
        <div className="inline-flex items-center gap-1.5">
          <FileText className="size-3" />
          <span
            className={
              bothSubmitted
                ? "text-success"
                : "text-[var(--color-bb-cobalt)]"
            }
          >
            {statusLabel}
          </span>
        </div>
      }
    >
      <div className="pt-6 pb-2">
        <Suspense>
          <BriefingTabs />
        </Suspense>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_18rem] gap-x-12 gap-y-8 py-10">
        <div>
          <EditorialEyebrow accent>
            {isInternal
              ? activeTab === "ops"
                ? "Customer logistics"
                : "Customer brief"
              : activeTab === "ops"
                ? "Your logistics"
                : "Your brief"}
          </EditorialEyebrow>
          <p className="mt-2 text-sm text-muted-foreground max-w-[58ch]">
            {isInternal
              ? activeTab === "ops"
                ? `Submitted by ${accountName}. Reference this when planning the build.`
                : `Submitted by ${accountName}. Reference this when building the creative.`
              : activeTab === "ops"
                ? "Fill in what you know now. We'll confirm the rest on a planning call."
                : "Answer what you can. Anything you skip we'll ask about on the kickoff call."}
          </p>
          <div className="mt-6">
            {activeTab === "ops" ? (
              <OpsBriefingForm
                eventId={id}
                initialResponses={opsBrief?.responses ?? {}}
                isSubmitted={opsSubmitted}
                readOnly={isInternal}
              />
            ) : (
              <BriefingForm
                eventId={id}
                initialResponses={creativeBrief?.responses ?? {}}
                isSubmitted={creativeSubmitted}
                readOnly={isInternal}
              />
            )}
          </div>
        </div>

        <BriefingSidebar activeTab={activeTab} eventId={id} isInternal={isInternal} />
      </section>

      <Hairline className="opacity-40" />

      <section className="py-8">
        <EditorialEyebrow accent>Supporting files</EditorialEyebrow>
        <p className="mt-2 text-sm text-muted-foreground max-w-[58ch] mb-6">
          {isInternal
            ? `Brand guidelines, logo packs, font files, and reference materials ${accountName} has shared with the creative team.`
            : "Brand guidelines, logo packs, font files, or reference materials — anything that helps the creative team understand your brand."}
        </p>
        <BriefingFileUpload eventId={id} existingFiles={briefingFiles} readOnly={isInternal} />
      </section>
    </EventPageShell>
  );
}
