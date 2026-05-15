/** Resolve the most contextually-relevant next step for an event */
import type { Event, Task, Asset, Approval } from "@/types";
import { STAGE_CONFIG } from "@/types";

export interface NextStep {
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  tone: "brand" | "warning" | "success" | "info";
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
  const pendingCustomerTasks = tasks.filter(
    (t) => t.customerVisible && t.status !== "complete" && t.status !== "skipped"
  );
  const pendingApprovals = approvals.filter((a) => a.status === "pending");
  const missingAssets = assets.filter(
    (a) => a.status === "required" || a.status === "rejected"
  );

  // 1. Event is blocked — must address health
  if (event.healthStatus === "red") {
    return {
      eyebrow: "Action needed",
      title: blockingTasks[0]?.title ?? "Resolve blocking issues to unblock delivery",
      description:
        "This event is flagged as blocked. Address blocking actions to get it back on track.",
      primaryAction: { label: "Open actions", href: `${eventBase}/actions` },
      tone: "warning",
    };
  }

  // 2. Event is live → straight to the live dashboard
  if (event.currentStage === "event_live") {
    return {
      eyebrow: "Event is live",
      title: "Track interactions in real time",
      description:
        "Live telemetry, leads, and machine health updates as your activation runs.",
      primaryAction: { label: "Open live dashboard", href: `${eventBase}/live` },
      secondaryAction: { label: "View leads", href: `${eventBase}/leads` },
      tone: "success",
    };
  }

  // 3. Reporting / Complete → show report
  if (event.currentStage === "reporting" || event.currentStage === "complete") {
    return {
      eyebrow: "Event wrap-up",
      title: "Review the proof-of-performance report",
      description: "See benchmarks, predictions vs actuals, and shareable highlights.",
      primaryAction: { label: "Open report", href: `${eventBase}/reports` },
      tone: "info",
    };
  }

  // 4. Pending approvals
  if (pendingApprovals.length > 0) {
    return {
      eyebrow: "Awaiting approval",
      title: `${pendingApprovals.length} item${pendingApprovals.length === 1 ? "" : "s"} need${pendingApprovals.length === 1 ? "s" : ""} your decision`,
      description: pendingApprovals[0]?.title
        ? `Latest: ${pendingApprovals[0]?.title}`
        : "Approve creative and configuration to advance the event.",
      primaryAction: { label: "Review approvals", href: `${eventBase}/approvals` },
      tone: "brand",
    };
  }

  // 5. Missing customer assets
  if (missingAssets.length > 0) {
    return {
      eyebrow: "Upload assets",
      title: `${missingAssets.length} asset${missingAssets.length === 1 ? "" : "s"} required`,
      description: "Upload your creative files so the Studio team can finalise your build.",
      primaryAction: { label: "Upload assets", href: `${eventBase}/assets` },
      tone: "brand",
    };
  }

  // 6. Customer or internal pending tasks
  if (pendingCustomerTasks.length > 0) {
    const next = pendingCustomerTasks[0];
    return {
      eyebrow: "Up next",
      title: next?.title ?? "Complete your outstanding actions",
      description: next?.description ??
        "Wrap up these items to keep your event delivery on schedule.",
      primaryAction: { label: "Open actions", href: `${eventBase}/actions` },
      tone: "brand",
    };
  }

  // 7. No customer-facing actions — push forward
  const stage = STAGE_CONFIG[event.currentStage];
  return {
    eyebrow: "On track",
    title: `Currently at ${stage?.label ?? event.currentStage}`,
    description:
      isInternal
        ? "All clear from the customer side. Advance the stage when your team is ready."
        : "All required items from your side are complete. We'll let you know when there's a new action.",
    primaryAction: { label: "View timeline", href: `${eventBase}/timeline` },
    secondaryAction: isInternal
      ? { label: "Open actions", href: `${eventBase}/actions` }
      : { label: "Send a message", href: `${eventBase}/communications` },
    tone: "success",
  };
}
