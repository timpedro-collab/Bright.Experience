/**
 * Two-track quoting engine server actions — re-exported from focused modules.
 *
 * Import from `@/app/actions/quotes` as before. Actions are defined (and
 * marked `"use server"`) in the sibling files; this barrel only stitches their
 * public surface back together.
 */

export { submitBookNowQuote, getBookingReceipt } from "./book-now";
export { submitProposalIntake, updateQuoteCapabilities } from "./proposal-intake";
export { prepareProposal, setProposalWalkthrough } from "./proposal-admin";
export { acceptQuote, declineQuote } from "./decisions";
