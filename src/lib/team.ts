/**
 * Named team personas surfaced to the customer at the threshold of commitment.
 *
 * The plan calls for a named human (Sarah) to appear on the confirmation and
 * post-accept screens. Pinning the persona in one file keeps the rest of the
 * codebase declarative: every "named AE" reference imports from here so we can
 * later route to a real round-robin or pick from a roster without surgery.
 */

export interface TeamPersona {
  /** First name as the customer reads it ("Sarah"). */
  firstName: string;
  /** Full name for sign-offs ("Sarah Chen"). */
  fullName: string;
  /** Job title used as a quiet caption ("Account Manager"). */
  title: string;
  /** Public-safe contact email. */
  email: string;
}

/**
 * The default account manager surfaced when a customer crosses the proposal
 * threshold. Swap to a real round-robin assignment when the AE roster is wired.
 */
export const DEFAULT_ACCOUNT_MANAGER: TeamPersona = {
  firstName: "Sarah",
  fullName: "Sarah Chen",
  title: "Account Manager",
  email: "sarah@brightblue.co.uk",
};
