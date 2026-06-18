/** The "From your team" column — account manager + real team members. */

import Link from "next/link";

import { EditorialEyebrow } from "@/components/brand";
import { DEFAULT_ACCOUNT_MANAGER } from "@/lib/team";
import type { EventTeamMember } from "@/types";

export function TeamColumn({
  eventId,
  members,
  hideEyebrow = false,
}: {
  eventId: string;
  members: EventTeamMember[];
  hideEyebrow?: boolean;
}) {
  const am = {
    initial: DEFAULT_ACCOUNT_MANAGER.firstName[0],
    name: DEFAULT_ACCOUNT_MANAGER.fullName,
    title: DEFAULT_ACCOUNT_MANAGER.title,
  };
  const approvedMembers = members
    .filter((m) => m.status === "approved")
    .slice(0, 4)
    .map((m) => ({
      initial: (m.profile?.name?.[0] ?? m.email[0]).toUpperCase(),
      name: m.profile?.name ?? m.email,
      title: m.roleLabel,
    }));
  const team = [am, ...approvedMembers];

  return (
    <div className="space-y-4">
      {!hideEyebrow && <EditorialEyebrow accent>From your team</EditorialEyebrow>}
      {team.length === 1 && approvedMembers.length === 0 ? (
        <>
          <TeamMemberRow member={am} />
          <p className="text-sm text-muted-foreground">
            Your account manager is your main point of contact. Invite
            teammates to collaborate here any time.
          </p>
        </>
      ) : (
        <ul className="flex flex-col gap-3">
          {team.map((m) => (
            <TeamMemberRow key={m.name} member={m} />
          ))}
        </ul>
      )}
      <Link
        href={`/events/${eventId}/communications`}
        className="inline-block text-overline text-[var(--color-bb-cobalt)] underline decoration-from-font underline-offset-4 font-medium"
      >
        Message your team →
      </Link>
    </div>
  );
}

function TeamMemberRow({
  member,
}: {
  member: { initial: string; name: string; title: string };
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex items-center justify-center size-8 rounded-full bg-card border border-border text-overline text-foreground">
        {member.initial}
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-medium text-foreground">
          {member.name}
        </span>
        <span className="text-overline text-muted-foreground">
          {member.title}
        </span>
      </span>
    </li>
  );
}
