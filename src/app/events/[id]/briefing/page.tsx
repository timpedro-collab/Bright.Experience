/**
 * Customer creative briefing — the editorial-language version of the
 * "tell us your story" intake form. Replaces the old AppShell + gradient
 * info card with the editorial chrome and a clean two-column reading
 * layout (form on the left, guidance on the right).
 */

import { notFound, redirect } from "next/navigation";
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
import { getEventById } from "@/lib/queries/events";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function BriefingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const [event, unread] = await Promise.all([
    getEventById(id),
    getUnreadCount(user.id),
  ]);
  if (!event) return notFound();

  const supabase = await createClient();
  const { data: briefing } = await supabase
    .from("briefing_responses")
    .select("*")
    .eq("event_id", id)
    .eq("form_type", "creative")
    .maybeSingle();

  const isSubmitted = briefing?.is_submitted ?? false;

  return (
    <EditionShell>
      <EditionChrome
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: event.name, href: `/events/${id}` },
          { label: "Creative briefing" },
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
        eyebrow={`${event.account.name} · Creative briefing`}
        title="Tell us your story."
        subtitle="A few prompts help our creative team design something that actually feels like your brand. You can save and come back to anything that needs more thought."
        rightSlot={
          <div className="inline-flex items-center gap-1.5">
            <FileText className="size-3" />
            <span
              className={
                isSubmitted
                  ? "text-success"
                  : "text-[var(--color-bb-cobalt)]"
              }
            >
              {isSubmitted ? "Submitted" : "In progress"}
            </span>
          </div>
        }
      />

      <EditionBody>
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_18rem] gap-x-12 gap-y-8 py-10">
          {/* The form — clean editorial spread */}
          <div>
            <EditorialEyebrow accent>Your brief</EditorialEyebrow>
            <p className="mt-2 text-sm text-muted-foreground max-w-[58ch]">
              Answer what you can. Anything you skip we&apos;ll ask about
              on the kickoff call.
            </p>
            <div className="mt-6">
              <BriefingForm
                eventId={id}
                initialResponses={briefing?.responses ?? {}}
                isSubmitted={isSubmitted}
              />
            </div>
          </div>

          {/* Sidebar guidance */}
          <aside className="space-y-8 lg:border-l lg:border-border/40 lg:pl-8">
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
                <li className="flex items-baseline gap-3 py-2.5">
                  <span className="text-overline text-muted-foreground tabular-nums">
                    01
                  </span>
                  <span className="text-sm text-foreground">
                    Match your brand voice across the experience
                  </span>
                </li>
                <li className="flex items-baseline gap-3 py-2.5">
                  <span className="text-overline text-muted-foreground tabular-nums">
                    02
                  </span>
                  <span className="text-sm text-foreground">
                    Tune the creative to your audience and the room
                  </span>
                </li>
                <li className="flex items-baseline gap-3 py-2.5">
                  <span className="text-overline text-muted-foreground tabular-nums">
                    03
                  </span>
                  <span className="text-sm text-foreground">
                    Bring the right ideas to your kickoff call
                  </span>
                </li>
              </ul>
            </div>

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
