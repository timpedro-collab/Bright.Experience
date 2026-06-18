/**
 * Booking flow feature flags.
 *
 * Kept out of the `"use server"` action modules so the helpers can stay
 * synchronous (server-action files may only export async functions) and be
 * unit-tested without pulling in server-only dependencies.
 */

/**
 * Demo-safe booking gate.
 *
 * Auto-provisioning a quote spins up a real account, event workspace and
 * customer invite. That is correct in production but dangerous while walking
 * someone through the funnel in a demo — every test booking would litter the
 * portal with throwaway events and fire a real invite email.
 *
 * Provisioning therefore only runs when `BOOKING_AUTO_PROVISION` is explicitly
 * enabled. Demos leave it unset, so a booking lands as a normal in-flight quote
 * an internal user can convert deliberately.
 */
export function shouldAutoProvisionQuote(): boolean {
  const flag = process.env.BOOKING_AUTO_PROVISION;
  return flag === "true" || flag === "1";
}
