/**
 * Flags for integration surfaces that are built but not yet connected.
 *
 * Kept free of server-only imports so the same helper can gate a page, a server
 * action and a navigation item.
 */

/**
 * Is the outbound public API / webhook programme live?
 *
 * `/admin/api` mints API keys and webhook subscriptions, and both are stored
 * faithfully — but nothing authenticates with a key and nothing delivers to a
 * subscription URL. An admin handing a partner a `bb_…` key would be handing
 * them a credential for an API that does not answer, and a partner pointing a
 * webhook at their endpoint would wait forever for a call that never comes.
 *
 * The surface therefore stays hidden until the API and the dispatcher exist.
 * Set `NEXT_PUBLIC_PUBLIC_API_ENABLED=1` to bring it back — it must be a
 * `NEXT_PUBLIC_` variable because the navigation that links to it renders on
 * the client.
 *
 * The inbound integrations that *are* live (Cal.com and Bright.Blue Cloud
 * webhooks, both signature-verified) are unaffected by this flag.
 */
export function isPublicApiEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_PUBLIC_API_ENABLED;
  return flag === "true" || flag === "1";
}
