/**
 * Welcome / onboarding page — greets first-time users, then launches
 * a role-specific animated product tour.
 */
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CalendarCheck, Sparkles, BarChart3, ArrowRight } from "lucide-react";

import {
  EditionShell,
  EditionChrome,
  EditionBody,
  EditionFooter,
  RidgeHero,
  EditorialEyebrow,
} from "@/components/brand";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { UserMenu } from "@/components/layout/UserMenu";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TourShell } from "@/components/onboarding/TourShell";
import { RestartTourButton } from "@/components/onboarding/RestartTourButton";
import {
  FirstRunChecklist,
  type ChecklistStep,
} from "@/components/onboarding/FirstRunChecklist";

import { getUser } from "@/lib/auth";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getEventsPaginated } from "@/lib/queries/events";
import { getTasksByEvent } from "@/lib/queries/tasks";
import { getAssetsByEvent } from "@/lib/queries/assets";
import { getApprovalsByEvent } from "@/lib/queries/approvals";
import { resolveEventNextStep } from "@/lib/event-next-step";
import { isInternalRole } from "@/lib/roles";
import { DEFAULT_ACCOUNT_MANAGER } from "@/lib/team";
import { machineRenderFor } from "@/lib/machine-renders";
import { formatDateLong } from "@/lib/dates";
import type { Event } from "@/types";

export const metadata = { title: "Welcome" };

const CAPABILITIES = [
  {
    icon: CalendarCheck,
    title: "Track your events",
    description:
      "Follow every milestone from confirmation to post-event reporting — all in one place.",
  },
  {
    icon: Sparkles,
    title: "Order creative assets",
    description:
      "Request static and motion visuals from the Bright.Studio team directly through the portal.",
  },
  {
    icon: BarChart3,
    title: "Review your results",
    description:
      "Access live telemetry, lead reports, and proof-of-performance dashboards after your event.",
  },
];

const INTERNAL_CAPABILITIES = [
  {
    icon: CalendarCheck,
    title: "Deliver every event",
    description:
      "Track the whole portfolio through the delivery pipeline, from kickoff to wrap.",
  },
  {
    icon: Sparkles,
    title: "Coordinate the team",
    description:
      "Assign work, advance stages, and keep creative, ops, and QA moving in lock-step.",
  },
  {
    icon: BarChart3,
    title: "Publish the results",
    description:
      "Generate proof-of-performance reports and share them with the customer.",
  },
];

function pickFeaturedEvent(events: Event[]): Event | null {
  if (events.length === 0) return null;
  const blocked = events.find((e) => e.healthStatus === "red");
  if (blocked) return blocked;
  const now = Date.now();
  const upcoming = events
    .filter((e) => new Date(e.eventDateStart).getTime() >= now)
    .sort(
      (a, b) =>
        new Date(a.eventDateStart).getTime() -
        new Date(b.eventDateStart).getTime(),
    )[0];
  return upcoming ?? events[0];
}

export default async function WelcomePage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const unread = await getUnreadCount(user.id);
  const firstName = user.name?.split(" ")[0] ?? "there";
  const isInternal = isInternalRole(user.role);

  // Customer onboarding: resolve their real next step + a first-run checklist
  // grounded in actual account state (event opened, first asset uploaded).
  let nextStep: ReturnType<typeof resolveEventNextStep> = null;
  let checklist: ChecklistStep[] = [];
  let featured: Event | null = null;

  if (!isInternal) {
    const { data: events } = await getEventsPaginated(1);
    featured = pickFeaturedEvent(events);

    let hasUploadedAsset = false;
    if (featured) {
      const [tasks, assets, approvals] = await Promise.all([
        getTasksByEvent(featured.id),
        getAssetsByEvent(featured.id),
        getApprovalsByEvent(featured.id),
      ]);
      hasUploadedAsset = assets.some((a) => a.status !== "required");
      nextStep = resolveEventNextStep({
        event: featured,
        tasks,
        assets,
        approvals,
        isInternal: false,
      });
    }

    checklist = [
      {
        id: "tour",
        label: "Take the guided tour",
        description: "A 60-second walk through your portal.",
        done: Boolean(user.hasCompletedOnboarding),
      },
      {
        id: "event",
        label: "Open your event workspace",
        description: featured
          ? `${featured.name} is ready for you.`
          : "Your workspace unlocks once an event is confirmed.",
        done: Boolean(featured),
        action: featured
          ? { label: "Open", href: `/events/${featured.id}` }
          : undefined,
      },
      {
        id: "asset",
        label: "Upload your first asset",
        description: "Logos, hero artwork, copy — anything we design with.",
        done: hasUploadedAsset,
        action: featured
          ? { label: "Upload", href: `/events/${featured.id}/assets` }
          : undefined,
      },
      {
        id: "manager",
        label: `Meet ${DEFAULT_ACCOUNT_MANAGER.firstName}, your account manager`,
        description: `${DEFAULT_ACCOUNT_MANAGER.fullName} · ${DEFAULT_ACCOUNT_MANAGER.title}.`,
        done: false,
        action: {
          label: "Say hi",
          href: `mailto:${DEFAULT_ACCOUNT_MANAGER.email}`,
        },
      },
    ];
  }

  return (
    <TourShell role={user.role} autoStart={!user.hasCompletedOnboarding}>
      <EditionShell>
        <EditionChrome
          breadcrumbs={[{ label: "Welcome" }]}
          rightSlot={
            <>
              <NotificationBell unreadCount={unread} />
              <span className="hidden md:block h-6 w-px bg-border" aria-hidden />
              <UserMenu user={user} />
            </>
          }
        />
        <RidgeHero
          variant="editorial"
          seed="welcome::onboarding"
          eyebrow="Welcome to Bright.Experience"
          title={`Hello, ${firstName}.`}
          subtitle={
            isInternal
              ? "Everything you need to deliver Bright.Blue activations lives here."
              : featured
                ? `${featured.name} is in motion — this is where you'll watch it come together.`
                : "Everything you need to manage your Bright.Blue activations lives here."
          }
        />
        <EditionBody>
          <div className="max-w-2xl mx-auto py-10 space-y-10">
            {/* First-login moment: their event and their machine, never an
                empty dashboard. */}
            {!isInternal && featured && (
              <Card className="overflow-hidden p-0">
                <div className="flex items-stretch gap-0">
                  <div className="relative w-32 shrink-0 bg-muted/40 sm:w-40">
                    <Image
                      src={machineRenderFor(featured.machineType)}
                      alt="Your machine"
                      fill
                      sizes="10rem"
                      className="object-contain p-3"
                    />
                  </div>
                  <CardContent className="flex-1 p-5">
                    <p className="text-overline text-[var(--color-bb-cobalt)]">
                      Your event
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {featured.name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDateLong(featured.eventDateStart)}
                      {featured.venueName ? ` · ${featured.venueName}` : ""}
                    </p>
                    <div className="mt-4">
                      <Button asChild variant="brand" size="sm">
                        <Link href={`/events/${featured.id}`}>
                          Open your workspace
                          <ArrowRight size={14} className="ml-1.5" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            )}

            {!isInternal && nextStep && (
              <div className="space-y-4">
                <EditorialEyebrow accent>Your next step</EditorialEyebrow>
                <Card className="p-6">
                  <CardContent className="p-0 space-y-3">
                    <p className="text-overline text-muted-foreground">
                      {nextStep.eyebrow}
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {nextStep.title}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {nextStep.description}
                    </p>
                    <div className="pt-1">
                      <Button asChild variant="brand">
                        <Link href={nextStep.primaryAction.href}>
                          {nextStep.primaryAction.label}
                          <ArrowRight size={16} className="ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {!isInternal && checklist.length > 0 && (
              <div className="space-y-4">
                <EditorialEyebrow>Get set up</EditorialEyebrow>
                <FirstRunChecklist steps={checklist} />
              </div>
            )}

            <EditorialEyebrow>What you can do</EditorialEyebrow>

            <div className="grid gap-5 sm:grid-cols-3">
              {(isInternal ? INTERNAL_CAPABILITIES : CAPABILITIES).map((cap) => {
                const Icon = cap.icon;
                return (
                  <Card key={cap.title} className="p-5 space-y-3">
                    <CardContent className="p-0 space-y-2">
                      <Icon size={22} className="text-primary" />
                      <p className="text-sm font-semibold">{cap.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {cap.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button asChild variant="brand" size="lg">
                <Link href="/">
                  {isInternal ? "Go to your library" : "Go to my events"}
                  <ArrowRight size={16} className="ml-2" />
                </Link>
              </Button>
              <RestartTourButton role={user.role} />
            </div>
          </div>
        </EditionBody>
        <EditionFooter
          rightSlot={
            <Link href="/" className="hover:opacity-80 transition-opacity">
              Back to home →
            </Link>
          }
        />
        <CommandPalette />
      </EditionShell>
    </TourShell>
  );
}
