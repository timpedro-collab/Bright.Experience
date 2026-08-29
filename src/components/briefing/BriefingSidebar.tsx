/** Briefing sidebar — contextual help panel for creative vs ops tabs. */
import Link from "next/link";
import { EditorialEyebrow, Hairline } from "@/components/brand";

interface BriefingSidebarProps {
  activeTab: "creative" | "ops";
  eventId: string;
  isInternal?: boolean;
}

export function BriefingSidebar({ activeTab, eventId, isInternal = false }: BriefingSidebarProps) {
  if (isInternal) {
    return (
      <aside className="space-y-8 lg:border-l lg:border-border/40 lg:pl-8">
        {activeTab === "creative" ? (
          <>
            <div>
              <EditorialEyebrow>How to use this</EditorialEyebrow>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                These are the customer&apos;s own words. Anchor the creative to
                them — brand voice, on-screen copy, and the cues that land with
                their audience.
              </p>
            </div>
            <Hairline />
            <div>
              <EditorialEyebrow>What to check for</EditorialEyebrow>
              <NumberedList
                items={[
                  "Gaps or vague answers to raise on the kickoff call",
                  "Must-include elements and things to avoid",
                  "Brand colours and reference material in the files",
                ]}
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <EditorialEyebrow>How to use this</EditorialEyebrow>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                The customer&apos;s logistics detail for the build. Confirm
                anything missing before locking the delivery plan.
              </p>
            </div>
            <Hairline />
            <div>
              <EditorialEyebrow>What to check for</EditorialEyebrow>
              <NumberedList
                items={[
                  "Venue access, power, and connectivity confirmed",
                  "Risk assessment and H&S documentation in place",
                  "Loading, parking, and staffing needs covered",
                ]}
              />
            </div>
          </>
        )}

        <Hairline />

        <div>
          <EditorialEyebrow>Need detail?</EditorialEyebrow>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Anything unclear or missing? Message the customer to fill the gaps.
          </p>
          <Link
            href={`/events/${eventId}/communications`}
            className="mt-3 inline-block text-overline text-primary underline decoration-from-font underline-offset-4 font-medium"
          >
            Message the customer →
          </Link>
        </div>
      </aside>
    );
  }

  return (
    <aside className="space-y-8 lg:border-l lg:border-border/40 lg:pl-8">
      {activeTab === "creative" ? (
        <>
          <div>
            <EditorialEyebrow>Why we ask</EditorialEyebrow>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Every great experience starts with a clear point of view. Your
              answers shape the creative direction, the copy on screen, and the
              cues we use to surprise your audience.
            </p>
          </div>
          <Hairline />
          <div>
            <EditorialEyebrow>What we&apos;ll do with it</EditorialEyebrow>
            <NumberedList
              items={[
                "Match your brand voice across the experience",
                "Tune the creative to your audience and the room",
                "Bring the right ideas to your kickoff call",
              ]}
            />
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
            <NumberedList
              items={[
                "We verify venue access and power supply",
                "Risk assessment and H&S documentation",
                "Logistics team confirms the delivery plan",
              ]}
            />
          </div>
        </>
      )}

      <Hairline />

      <div>
        <EditorialEyebrow>Need a hand?</EditorialEyebrow>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Stuck on a question? Drop us a message and your account manager will
          jump in.
        </p>
        <Link
          href={`/events/${eventId}/communications`}
          className="mt-3 inline-block text-overline text-primary underline decoration-from-font underline-offset-4 font-medium"
        >
          Message your team →
        </Link>
      </div>
    </aside>
  );
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 flex flex-col divide-y divide-border/40 border-t border-b border-border/40">
      {items.map((item, i) => (
        <li key={i} className="flex items-baseline gap-3 py-2.5">
          <span className="text-overline text-muted-foreground tabular-nums">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="text-sm text-foreground">{item}</span>
        </li>
      ))}
    </ul>
  );
}
