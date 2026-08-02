/**
 * Brand primitives — the canonical Bright.Experience design language.
 * Every editorial surface composes from this barrel.
 */
export { RidgeArtwork } from "./ridge-artwork";
export { EditorialEyebrow, Hairline } from "./editorial";
export {
  EditionShell,
  EditionChrome,
  EditionBody,
  EditionFooter,
  RidgeHero,
  ThreeColumn,
  type EditionTheme,
  type EditionBreadcrumb,
} from "./edition-shell";
export { EditionPlate, type PlateStatusTone } from "./edition-plate";
// NOTE: EventPageShell is intentionally NOT re-exported here. It is an async
// server component that fetches per-section status (server-only), so exposing
// it through this barrel — which is also imported by client components (error
// boundaries, dashboards) — would pull `next/headers` into the client bundle.
// Import it directly from "@/components/brand/event-page-shell" instead.
export { EventTabNav } from "./EventTabNav";
export { AdminPageShell } from "./admin-page-shell";
export {
  PortalPageShell,
  partnerTabs,
  venueTabs,
  venueRoleLabel,
  organizerTabs,
  organizerRoleLabel,
} from "./portal-page-shell";
export { PortalTabNav, type PortalTab } from "./PortalTabNav";
export {
  BrandStatusShell,
  BrandErrorState,
  BrandGlobalError,
} from "./brand-status";
