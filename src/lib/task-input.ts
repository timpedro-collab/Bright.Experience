/**
 * Submission-gated tasks.
 *
 * Some tasks are completed by submitting a real artifact in the portal —
 * uploading files, submitting the briefing, confirming setup, etc. — not by
 * ticking a box. For those, the round "mark complete" control is misleading:
 * a customer could cross the item off without ever supplying what's actually
 * needed, leaving the delivery team chasing missing inputs.
 *
 * This map keys off a task's `targetPath` (the section its input lives in) and
 * provides the call-to-action that routes the owner to that input. Submitting
 * the input is what completes the task, via `autoCompleteTaskByPath` in
 * `app/actions/tasks.ts`. Every path listed here MUST have a matching
 * `autoCompleteTaskByPath(eventId, "<path>")` call on its submit action, or the
 * CTA would lead to a dead end that never closes the task.
 */

export interface TaskInputGate {
  /** Verb-led label for the primary CTA the task owner sees. */
  cta: string;
  /** Plain-English reassurance about how the task gets completed. */
  hint: string;
}

const SUBMISSION_GATED: Record<string, TaskInputGate> = {
  assets: {
    cta: "Upload your files",
    hint: "Completes automatically once your files are uploaded.",
  },
  briefing: {
    cta: "Open the briefing form",
    hint: "Completes automatically once you submit the form.",
  },
  configuration: {
    cta: "Open setup",
    hint: "Completes automatically once you submit your details.",
  },
  logistics: {
    cta: "Add the details",
    hint: "Completes automatically once the details are added.",
  },
  qa: {
    cta: "Open the QA checklist",
    hint: "Completes automatically once every check passes.",
  },
};

/**
 * If a task is completed by submitting an input rather than a manual tick,
 * return its CTA metadata; otherwise `null` (manual completion is fine).
 */
export function taskInputGate(task: { targetPath?: string }): TaskInputGate | null {
  if (!task.targetPath) return null;
  return SUBMISSION_GATED[task.targetPath] ?? null;
}
