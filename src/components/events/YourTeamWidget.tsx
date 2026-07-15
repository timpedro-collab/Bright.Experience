/** "Your team" widget — shows who handles what, with direct message links. */
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { DEFAULT_ACCOUNT_MANAGER } from "@/lib/team";
import type { EventTeamMember } from "@/types";

interface YourTeamWidgetProps {
  eventId: string;
  members: EventTeamMember[];
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  events_lead: "Your account",
  creative_lead: "Creative",
  operations_lead: "Logistics & ops",
  qa_lead: "Quality assurance",
  admin: "Support",
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function YourTeamWidget({ eventId, members }: YourTeamWidgetProps) {
  const am = {
    name: DEFAULT_ACCOUNT_MANAGER.fullName,
    role: "events_lead",
    description: "Your account",
  };

  const team = [
    am,
    ...members
      .filter((m) => m.status === "approved")
      .slice(0, 5)
      .map((m) => ({
        name: m.profile?.name ?? m.email,
        role: m.roleLabel,
        description: ROLE_DESCRIPTIONS[m.roleLabel] ?? m.roleLabel,
      })),
  ];

  return (
    <div className="rounded-xl border border-border/60 bg-muted/40 p-4 space-y-3">
      <p className="text-overline text-muted-foreground uppercase tracking-wider text-[11px] font-medium">
        Your team
      </p>
      <ul className="space-y-2.5">
        {team.map((member) => (
          <li key={member.name} className="flex items-center gap-3">
            <span className="flex items-center justify-center size-8 rounded-full bg-card border border-border text-overline text-foreground text-xs">
              {initials(member.name)}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
              <p className="text-xs text-muted-foreground">{member.description}</p>
            </div>
          </li>
        ))}
      </ul>
      <Link
        href={`/events/${eventId}/communications`}
        className="inline-flex items-center gap-1.5 text-xs text-[var(--color-bb-cobalt)] hover:underline"
      >
        <MessageCircle size={12} />
        Message your team
      </Link>
    </div>
  );
}
