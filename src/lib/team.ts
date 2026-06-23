/**
 * Named team personas surfaced to the customer at the threshold of commitment.
 *
 * The plan calls for a named human (Sarah) to appear on the confirmation and
 * post-accept screens. Pinning the persona in one file keeps the rest of the
 * codebase declarative: every "named AE" reference imports from here so we can
 * later route to a real round-robin or pick from a roster without surgery.
 */

export interface TeamPersona {
  /** First name as the customer reads it ("Tim"). */
  firstName: string;
  /** Full name for sign-offs ("Tim Pedro"). */
  fullName: string;
  /** Job title used as a quiet caption ("Account Manager"). */
  title: string;
  /** Public-safe contact email. */
  email: string;
}

/**
 * The default account manager surfaced when a customer crosses the proposal
 * threshold. This is the same person (Tim Pedro, the events lead) who works
 * the quote inside the portal, so the customer books and meets one consistent
 * human. Swap to a real round-robin assignment when the AE roster is wired.
 */
export const DEFAULT_ACCOUNT_MANAGER: TeamPersona = {
  firstName: "Tim",
  fullName: "Tim Pedro",
  title: "Event Lead",
  email: "tim@brightblue.co.uk",
};

/**
 * Scheduling link for the 15-minute proposal walkthrough call. Set
 * `NEXT_PUBLIC_CALENDLY_URL` to the real Calendly event; the fallback keeps the
 * flow working in demos.
 */
export const PROPOSAL_CALL_URL =
  process.env.NEXT_PUBLIC_CALENDLY_URL ??
  "https://calendly.com/bright-blue/proposal-walkthrough";
