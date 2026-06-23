/**
 * Tiny event bus so any surface (mobile nav drawer, floating search button)
 * can open the global command palette without prop-drilling its open state
 * through every shell that mounts it.
 */
const EVENT_NAME = "bright:open-command";

/** Ask the mounted CommandPalette to open. Safe to call from any client code. */
export function openCommandPalette(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

/** Subscribe the CommandPalette to open requests. Returns an unsubscribe fn. */
export function onOpenCommandPalette(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
