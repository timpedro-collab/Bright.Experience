import type { UserRole } from "@/types";
import type { TourConfig } from "./types";
import { customerUserTour } from "./customer-user";
import { customerAdminTour } from "./customer-admin";
import { eventsLeadTour } from "./events-lead";
import { creativeLeadTour } from "./creative-lead";
import { operationsLeadTour } from "./operations-lead";
import { qaLeadTour } from "./qa-lead";
import { adminTour } from "./admin";
import { partnerTour, venueTour } from "./partner";

const TOUR_MAP: Record<UserRole, TourConfig> = {
  customer_user: customerUserTour,
  customer_admin: customerAdminTour,
  events_lead: eventsLeadTour,
  creative_lead: creativeLeadTour,
  operations_lead: operationsLeadTour,
  qa_lead: qaLeadTour,
  admin: adminTour,
  partner_member: partnerTour,
  partner_admin: partnerTour,
};

export function getTourForRole(role: UserRole): TourConfig {
  return TOUR_MAP[role] ?? customerUserTour;
}

export { venueTour };
export type { TourConfig, TourStep } from "./types";
