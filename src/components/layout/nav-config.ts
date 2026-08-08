/**
 * Shared navigation config.
 *
 * Single source of truth for the internal app's destination set, consumed by
 * both the desktop {@link InternalNavRail} and the mobile drawer
 * ({@link MobileNav}). Keeping it here means the two never drift.
 */
import {
  LayoutDashboard,
  GitBranch,
  Inbox,
  CheckSquare,
  Sparkles,
  Clock,
  FileText,
  Receipt,
  Handshake,
  Building2,
  Layers,
  Boxes,
  MapPin,
  BarChart3,
  Lightbulb,
  Users,
  Key,
  Activity,
} from "lucide-react";

import {
  isAdminRole,
  canViewCreativeQueue,
  canViewCommercial,
  canViewCreativeProduct,
  canViewLocations,
} from "@/lib/roles";
import { isPublicApiEnabled } from "@/lib/integration-flags";
import type { UserRole } from "@/types";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  /** Whether this role may see the item. */
  show: (role: UserRole) => boolean;
}

export interface NavSection {
  heading: string;
  items: NavItem[];
}

const ALWAYS = () => true;

const INTERNAL_SECTIONS: NavSection[] = [
  {
    heading: "Workspace",
    items: [
      { label: "Command center", href: "/", icon: LayoutDashboard, show: ALWAYS },
      { label: "Pipeline", href: "/pipeline", icon: GitBranch, show: ALWAYS },
      { label: "Inbox", href: "/inbox", icon: Inbox, show: ALWAYS },
    ],
  },
  {
    heading: "Delivery",
    items: [
      { label: "Asset reviews", href: "/admin/asset-reviews", icon: CheckSquare, show: canViewCreativeQueue },
      { label: "Studio orders", href: "/studio", icon: Sparkles, show: canViewCreativeProduct },
      { label: "Customer queue", href: "/admin/customer-queue", icon: Clock, show: canViewCommercial },
    ],
  },
  {
    heading: "Commercial",
    items: [
      { label: "Quotes", href: "/admin/quotes", icon: FileText, show: canViewCommercial },
      { label: "Invoices", href: "/admin/invoices", icon: Receipt, show: canViewCommercial },
      { label: "Partners", href: "/admin/partners", icon: Handshake, show: canViewCommercial },
      { label: "Organizers", href: "/admin/organizers", icon: Building2, show: canViewCommercial },
      { label: "Deal registrations", href: "/admin/deals", icon: Handshake, show: canViewCommercial },
      { label: "Campaigns", href: "/admin/campaigns", icon: Layers, show: canViewCommercial },
    ],
  },
  {
    heading: "Catalog & data",
    items: [
      { label: "Catalog", href: "/admin/catalog", icon: Boxes, show: canViewCreativeProduct },
      { label: "Templates", href: "/admin/templates", icon: FileText, show: canViewCommercial },
      { label: "Locations", href: "/admin/locations", icon: MapPin, show: canViewLocations },
      { label: "Benchmarks", href: "/admin/benchmarks", icon: BarChart3, show: canViewCommercial },
      { label: "Loop pulse", href: "/admin/loop-pulse", icon: Activity, show: canViewCommercial },
      { label: "Recommendations", href: "/admin/recommendations", icon: Lightbulb, show: canViewCommercial },
    ],
  },
  {
    heading: "Admin",
    items: [
      { label: "Users", href: "/admin/users", icon: Users, show: isAdminRole },
      {
        label: "API & integrations",
        href: "/admin/api",
        icon: Key,
        // The page 404s while the public API is off, so don't link to it.
        show: (role) => isAdminRole(role) && isPublicApiEnabled(),
      },
    ],
  },
];

/** Internal sections with each section's items filtered to the viewer's role. */
export function internalSectionsForRole(role: UserRole): NavSection[] {
  return INTERNAL_SECTIONS.map((s) => ({
    heading: s.heading,
    items: s.items.filter((i) => i.show(role)),
  })).filter((s) => s.items.length > 0);
}

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
