/** QA checklist types — the readiness gate before an event goes live. */

/** QA check result status */
export type QAItemStatus = "pending" | "passed" | "failed" | "fixed" | "na";

/** QA checklist category groupings */
export type QACategory =
  | "machine"
  | "game_logic"
  | "ux_ui"
  | "webform"
  | "wrap"
  | "logistics"
  | "product"
  | "other";

/** A single QA checklist item tied to an event */
export interface QAItem {
  id: string;
  eventId: string;
  category: QACategory;
  title: string;
  description?: string;
  status: QAItemStatus;
  testedBy?: string;
  testedAt?: string;
  failureReason?: string;
  fixDescription?: string;
  fixedBy?: string;
  fixedAt?: string;
  evidenceUrl?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
