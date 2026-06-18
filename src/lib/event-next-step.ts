/**
 * Resolve the single most useful "what should I do next" CTA for an event.
 *
 * The resolver walks a priority waterfall:
 *   1. Health is red → fix the blocker first.
 *   2. Active stage shortcuts (event_live → live dashboard, reporting → report).
 *   3. Cross-cutting blockers (pending approvals, missing assets, customer
 *      tasks) — these override the stage default because they're explicit
 *      asks from the team or the customer.
 *   4. Per-stage next step from `STAGE_NEXT_STEP` — what does this stage
 *      *want* the viewer to do? Customers see a customer-safe CTA;
 *      internal viewers get an internal-flavoured one.
 *   5. Fallback "on track" if we run out of ideas (shouldn't happen with
 *      a complete map, but kept defensive).
 */
import type { Event, Task, Asset, Approval, Stage, UserRole } from "@/types";
import { STAGE_CONFIG } from "@/types";

export interface NextStep {
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  tone: "brand" | "warning" | "success" | "info";
}

interface StageNextStepEntry {
  customer: Omit<NextStep, "primaryAction" | "secondaryAction"> & {
    primaryHref: string;
    primaryLabel: string;
    secondary?: { label: string; href: string };
  };
  internal: Omit<NextStep, "primaryAction" | "secondaryAction"> & {
    primaryHref: string;
    primaryLabel: string;
    secondary?: { label: string; href: string };
  };
}

const STAGE_NEXT_STEP: Record<Stage, StageNextStepEntry> = {
  confirmed: {
    customer: {
      eyebrow: "Welcome aboard",
      title: "Tell us about the activation",
      description:
        "Fill in the creative brief so the team can start designing your moment.",
      tone: "brand",
      primaryLabel: "Start the brief",
      primaryHref: "briefing",
      secondary: { label: "See the plan", href: "deadlines" },
    },
    internal: {
      eyebrow: "Kickoff",
      title: "Send the brief and book the kickoff",
      description:
        "Confirm the customer's primary contact and trigger the briefing.",
      tone: "brand",
      primaryLabel: "Open briefing",
      primaryHref: "briefing",
      secondary: { label: "Open actions", href: "actions" },
    },
  },
  kickoff_complete: {
    customer: {
      eyebrow: "Briefing in motion",
      title: "Review the briefing summary",
      description:
        "Your team has accepted the briefing. Make sure the details look right.",
      tone: "info",
      primaryLabel: "Review briefing",
      primaryHref: "briefing",
    },
    internal: {
      eyebrow: "Briefing accepted",
      title: "Set up creative + ops",
      description:
        "Confirm the milestones for creative production and operations setup.",
      tone: "brand",
      primaryLabel: "Open actions",
      primaryHref: "actions",
      secondary: { label: "Open timeline", href: "timeline" },
    },
  },
  creative_assets: {
    customer: {
      eyebrow: "Assets due",
      title: "Upload your creative",
      description:
        "Logos, hero artwork, copy — anything we need to design and produce the activation.",
      tone: "brand",
      primaryLabel: "Upload assets",
      primaryHref: "assets",
    },
    internal: {
      eyebrow: "Assets gathering",
      title: "Chase outstanding assets",
      description:
        "Make sure every required asset is on its way before Studio starts building.",
      tone: "brand",
      primaryLabel: "Open assets",
      primaryHref: "assets",
      secondary: { label: "Send a nudge", href: "communications" },
    },
  },
  approvals: {
    customer: {
      eyebrow: "Awaiting approval",
      title: "Review and approve",
      description:
        "Take a look at the proof and either approve or send back with notes.",
      tone: "brand",
      primaryLabel: "Open approvals",
      primaryHref: "approvals",
    },
    internal: {
      eyebrow: "Approvals queue",
      title: "Push approvals over the line",
      description:
        "Some assets are with the customer. Nudge or follow up on revisions.",
      tone: "brand",
      primaryLabel: "Open approvals",
      primaryHref: "approvals",
      secondary: { label: "Communications", href: "communications" },
    },
  },
  build_configuration: {
    customer: {
      eyebrow: "In production",
      title: "Studio is building your activation",
      description:
        "You'll be asked to approve the first proof shortly. Keep an eye on this page.",
      tone: "info",
      primaryLabel: "See the schedule",
      primaryHref: "deadlines",
    },
    internal: {
      eyebrow: "Studio production",
      title: "Track the build",
      description:
        "Confirm progress against the production milestones and queue the next approval.",
      tone: "brand",
      primaryLabel: "Open actions",
      primaryHref: "actions",
      secondary: { label: "Open studio", href: "studio" },
    },
  },
  qa_readiness: {
    customer: {
      eyebrow: "Quality assurance",
      title: "We're running the final checks",
      description:
        "Bright.Blue QA is testing hardware, software and creative end-to-end.",
      tone: "info",
      primaryLabel: "See progress",
      primaryHref: "timeline",
    },
    internal: {
      eyebrow: "QA in progress",
      title: "Run the QA checklist",
      description:
        "Pass, fail and document each check, then record the QA sign-off to clear the gate.",
      tone: "brand",
      primaryLabel: "Open QA",
      primaryHref: "qa",
    },
  },
  logistics_confirmed: {
    customer: {
      eyebrow: "Logistics",
      title: "Delivery is being scheduled",
      description:
        "Confirm the on-site contact and access requirements for setup day.",
      tone: "brand",
      primaryLabel: "Complete setup details",
      primaryHref: "actions",
    },
    internal: {
      eyebrow: "Logistics",
      title: "Lock the delivery plan",
      description:
        "Confirm courier slot, on-site contact, and packing list before the event.",
      tone: "brand",
      primaryLabel: "Open logistics",
      primaryHref: "logistics",
    },
  },
  event_live: {
    customer: {
      eyebrow: "Live now",
      title: "Watch the activation in real time",
      description:
        "Plays, leads, machine health — all updating as your moment runs.",
      tone: "success",
      primaryLabel: "Open live dashboard",
      primaryHref: "live",
      secondary: { label: "View leads", href: "leads" },
    },
    internal: {
      eyebrow: "Live operations",
      title: "Monitor the activation",
      description:
        "Telemetry, leads, machine status. Escalate anything off-pattern in comms.",
      tone: "success",
      primaryLabel: "Open live dashboard",
      primaryHref: "live",
      secondary: { label: "Communications", href: "communications" },
    },
  },
  reporting: {
    customer: {
      eyebrow: "Wrap-up",
      title: "Review the proof-of-performance report",
      description:
        "Benchmarks, predictions vs actuals, and a shareable summary you can hand to your team.",
      tone: "info",
      primaryLabel: "Open report",
      primaryHref: "reports",
    },
    internal: {
      eyebrow: "Reporting",
      title: "Finalise and publish the report",
      description:
        "Validate the metrics, write the executive highlights, and publish the share link.",
      tone: "info",
      primaryLabel: "Open report",
      primaryHref: "reports",
      secondary: { label: "Send to customer", href: "communications" },
    },
  },
  complete: {
    customer: {
      eyebrow: "All wrapped",
      title: "Your event is complete",
      description:
        "The post-event report is published. Ready to plan the next one?",
      tone: "success",
      primaryLabel: "Open report",
      primaryHref: "reports",
      secondary: { label: "Plan another", href: "/book/configure" },
    },
    internal: {
      eyebrow: "Complete",
      title: "Event wrapped — archive when ready",
      description:
        "Everything's filed. Run a retro or follow up on rebook intent.",
      tone: "success",
      primaryLabel: "Open report",
      primaryHref: "reports",
      secondary: { label: "Customer queue", href: "/admin/customer-queue" },
    },
  },
};

function buildStageStep(
  stage: Stage,
  eventBase: string,
  viewer: "customer" | "internal"
): NextStep {
  const entry = STAGE_NEXT_STEP[stage][viewer];
  const primaryHref = entry.primaryHref.startsWith("/")
    ? entry.primaryHref
    : `${eventBase}/${entry.primaryHref}`;
  const secondary = entry.secondary
    ? {
        label: entry.secondary.label,
        href: entry.secondary.href.startsWith("/")
          ? entry.secondary.href
          : `${eventBase}/${entry.secondary.href}`,
      }
    : undefined;
  return {
    eyebrow: entry.eyebrow,
    title: entry.title,
    description: entry.description,
    primaryAction: { label: entry.primaryLabel, href: primaryHref },
    secondaryAction: secondary,
    tone: entry.tone,
  };
}

export function nextStepForStage(
  stage: Stage,
  eventId: string,
  role: UserRole
): NextStep {
  const eventBase = `/events/${eventId}`;
  const viewer: "customer" | "internal" =
    role === "customer_admin" || role === "customer_user"
      ? "customer"
      : "internal";
  return buildStageStep(stage, eventBase, viewer);
}

export function resolveEventNextStep({
  event,
  tasks,
  assets,
  approvals,
  isInternal,
}: {
  event: Event;
  tasks: Task[];
  assets: Asset[];
  approvals: Approval[];
  isInternal: boolean;
}): NextStep | null {
  const eventBase = `/events/${event.id}`;
  const blockingTasks = tasks.filter(
    (t) => t.isBlocking && t.status !== "complete" && t.status !== "skipped"
  );
  const pendingApprovals = approvals.filter((a) => a.status === "pending");
  const missingAssets = assets.filter(
    (a) => a.status === "required" || a.status === "rejected"
  );

  // 1. Health red → fix the blocker (regardless of stage).
  if (event.healthStatus === "red") {
    if (isInternal) {
      return {
        eyebrow: "Action needed",
        title:
          blockingTasks[0]?.title ??
          "Resolve blocking issues to unblock delivery",
        description:
          "This event is flagged as blocked. Address blocking actions to get it back on track.",
        primaryAction: { label: "Open actions", href: `${eventBase}/actions` },
        tone: "warning",
      };
    }
    // Customer-safe: no "blocked"/"blocking" jargon, surface their own item.
    const customerBlocker = blockingTasks.find((t) => t.customerVisible);
    return {
      eyebrow: "Needs your attention",
      title: customerBlocker?.title ?? "A few things need your sign-off",
      description:
        "Complete the items on your list to keep your event moving.",
      primaryAction: { label: "Review your actions", href: `${eventBase}/actions` },
      tone: "warning",
    };
  }

  // 2. Stage-driven shortcuts that *always* win when reached.
  if (event.currentStage === "event_live") {
    return buildStageStep(
      "event_live",
      eventBase,
      isInternal ? "internal" : "customer"
    );
  }

  // 3. Cross-cutting customer-facing blockers — these override the
  //    default stage CTA because they're explicit asks.
  const customerName = event.account?.name ?? "the customer";
  if (pendingApprovals.length > 0) {
    const first = pendingApprovals[0];
    const n = pendingApprovals.length;
    return {
      eyebrow: isInternal ? "Awaiting customer" : "Awaiting approval",
      title: isInternal
        ? `${n} item${n === 1 ? "" : "s"} awaiting ${customerName} sign-off`
        : `${n} item${n === 1 ? "" : "s"} need${n === 1 ? "s" : ""} a decision`,
      description: isInternal
        ? first?.title
          ? `Latest: ${first.title}. Nudge the customer if it stalls.`
          : "Waiting on the customer to approve or request changes."
        : first?.title
          ? `Latest: ${first.title}`
          : "Approve creative and configuration to advance the event.",
      primaryAction: {
        label: isInternal ? "View approvals" : "Review approvals",
        href: `${eventBase}/approvals`,
      },
      tone: "brand",
    };
  }
  if (missingAssets.length > 0) {
    const n = missingAssets.length;
    return {
      eyebrow: "Assets due",
      title: `${n} asset${n === 1 ? "" : "s"} still ${isInternal ? "outstanding" : "required"}`,
      description: isInternal
        ? `Waiting on ${customerName} to upload before Studio can build.`
        : "Upload your creative files so the Studio team can finalise your build.",
      primaryAction: {
        label: isInternal ? "View assets" : "Upload assets",
        href: `${eventBase}/assets`,
      },
      tone: "brand",
    };
  }

  // 4. Per-stage default CTA — what does this stage want the viewer to do?
  const viewer: "customer" | "internal" = isInternal ? "internal" : "customer";
  const stageStep = buildStageStep(event.currentStage, eventBase, viewer);
  if (stageStep) return stageStep;

  // 5. Defensive fallback.
  const stage = STAGE_CONFIG[event.currentStage];
  return {
    eyebrow: "On track",
    title: `Currently at ${stage?.label ?? event.currentStage}`,
    description: isInternal
      ? "All clear from the customer side. Advance the stage when your team is ready."
      : "All required items from your side are complete. We'll let you know when there's a new action.",
    primaryAction: isInternal
      ? { label: "View timeline", href: `${eventBase}/timeline` }
      : { label: "Back to overview", href: eventBase },
    tone: "success",
  };
}
