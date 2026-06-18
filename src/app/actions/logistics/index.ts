/**
 * Logistics server actions — re-exported from focused per-concern modules.
 *
 * Import from `@/app/actions/logistics` as before. The actions are defined
 * (and marked `"use server"`) in the sibling files; this barrel only stitches
 * their public surface back together.
 */

export { getOnsiteContact, saveOnsiteContact } from "./onsite-contact";
export type { OnsiteContact } from "./onsite-contact";

export { getDeliveryWindows, saveDeliveryWindows } from "./delivery-windows";
export type { DeliveryWindow, DeliveryWindows } from "./delivery-windows";

export { getVenueAccess, saveVenueAccess } from "./venue-access";
export type { VenueAccess } from "./venue-access";

export { getLogisticsProvider, saveLogisticsProvider } from "./provider";
export type { LogisticsProvider } from "./provider";

export { updateLogisticsEntry, addLogisticsEntry } from "./entries";
