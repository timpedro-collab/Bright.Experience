/** Persona-aware sidebar — internal, partner, venue, customer scopes */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  ListChecks,
  Upload,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Settings,
  ChevronsLeft,
  Zap,
  FileText,
  MessageCircle,
  Truck,
  ShieldCheck,
  Activity,
  Users,
  UserPlus,
  Handshake,
  DollarSign,
  FolderOpen,
  Layers,
  Lightbulb,
  Key,
  MapPin,
  Database,
  Briefcase,
  Clock,
  Inbox,
  ArrowUpRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { BrandLockup, BrandMark } from "@/components/ui/brand-mark";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  exact?: boolean;
  dataTour?: string;
}

interface NavGroup {
  heading: string;
  items: NavItem[];
}

interface SidebarProps {
  isInternal?: boolean;
  eventId?: string;
  partnerSlug?: string;
  venueSlug?: string;
  collapsed: boolean;
  onToggle: () => void;
  notificationCount?: number;
  isPartner?: boolean;
}

function buildGroups({
  isInternal,
  eventId,
  partnerSlug,
  venueSlug,
  isPartner,
  notificationCount = 0,
}: Omit<SidebarProps, "collapsed" | "onToggle">): NavGroup[] {
  const groups: NavGroup[] = [];

  const workspace: NavItem[] = [
    {
      label: isInternal ? "All Events" : "My Events",
      href: "/",
      icon: LayoutDashboard,
      exact: true,
      dataTour: "pipeline",
    },
    { label: "Notifications", href: "/notifications", icon: Activity, badge: notificationCount },
  ];

  if (isInternal) {
    workspace.push({ label: "Pipeline", href: "/pipeline", icon: Layers });
    workspace.push({ label: "Studio Queue", href: "/studio", icon: Sparkles });
  }

  groups.push({ heading: "Workspace", items: workspace });

  if (eventId) {
    const eventItems: NavItem[] = [
      { label: "Overview", href: `/events/${eventId}`, icon: Zap, exact: true, dataTour: "event-detail" },
      { label: "Timeline", href: `/events/${eventId}/timeline`, icon: CalendarCheck },
      { label: "Actions", href: `/events/${eventId}/actions`, icon: ListChecks },
      { label: "Communications", href: `/events/${eventId}/communications`, icon: MessageCircle },
      { label: "Assets", href: `/events/${eventId}/assets`, icon: Upload, dataTour: "assets" },
      { label: "Approvals", href: `/events/${eventId}/approvals`, icon: CheckCircle2 },
      { label: "Briefing", href: `/events/${eventId}/briefing`, icon: FileText, dataTour: "briefing" },
      { label: "Studio", href: `/events/${eventId}/studio`, icon: Sparkles },
    ];
    if (isInternal) {
      eventItems.push({ label: "Logistics", href: `/events/${eventId}/logistics`, icon: Truck });
      eventItems.push({ label: "QA", href: `/events/${eventId}/qa`, icon: ShieldCheck });
    }
    eventItems.push({ label: "Live", href: `/events/${eventId}/live`, icon: Activity, dataTour: "live" });
    eventItems.push({ label: "Leads", href: `/events/${eventId}/leads`, icon: Users });
    eventItems.push({ label: "Reports", href: `/events/${eventId}/reports`, icon: BarChart3, dataTour: "reports" });
    if (isInternal) {
      eventItems.push({ label: "Campaign", href: `/events/${eventId}/campaign`, icon: Layers });
    }
    groups.push({ heading: "This event", items: eventItems });
  }

  if (partnerSlug && (isPartner || isInternal)) {
    groups.push({
      heading: "Partner",
      items: [
        { label: "Dashboard", href: `/partners/${partnerSlug}/dashboard`, icon: LayoutDashboard, exact: true },
        { label: "Clients", href: `/partners/${partnerSlug}/clients`, icon: Users },
        { label: "Quotes", href: `/partners/${partnerSlug}/quotes`, icon: FileText },
        { label: "Commissions", href: `/partners/${partnerSlug}/commissions`, icon: DollarSign },
        { label: "Resources", href: `/partners/${partnerSlug}/resources`, icon: FolderOpen },
      ],
    });
  }

  if (venueSlug) {
    groups.push({
      heading: "Venue",
      items: [
        { label: "Dashboard", href: `/venues/${venueSlug}/dashboard`, icon: LayoutDashboard, exact: true },
        { label: "Placements", href: `/venues/${venueSlug}/placements`, icon: MapPin },
        { label: "Sponsorships", href: `/venues/${venueSlug}/sponsorships`, icon: Sparkles },
        { label: "Packages", href: `/venues/${venueSlug}/packages`, icon: Layers },
        { label: "Embed", href: `/venues/${venueSlug}/embed`, icon: Key },
      ],
    });
  }

  if (isInternal) {
    groups.push({
      heading: "Pipeline",
      items: [
        { label: "Inbox", href: "/inbox", icon: Inbox, dataTour: "inbox" },
        { label: "Quotes", href: "/admin/quotes", icon: Briefcase },
        {
          label: "Asset reviews",
          href: "/admin/asset-reviews",
          icon: CheckCircle2,
        },
        {
          label: "Customer queue",
          href: "/admin/customer-queue",
          icon: Clock,
        },
      { label: "Partners", href: "/admin/partners", icon: Handshake },
      { label: "Invites", href: "/admin/invites", icon: UserPlus },
      { label: "Campaigns", href: "/admin/campaigns", icon: Layers },
      ],
    });
    groups.push({
      heading: "Catalog & data",
      items: [
        { label: "Catalog", href: "/admin/catalog", icon: Sparkles },
        { label: "Public catalog", href: "/catalog", icon: ArrowUpRight },
        { label: "Templates", href: "/admin/templates", icon: FileText },
        { label: "Locations", href: "/admin/locations", icon: MapPin },
        { label: "Benchmarks", href: "/admin/benchmarks", icon: BarChart3 },
        { label: "Recommendations", href: "/admin/recommendations", icon: Lightbulb },
      ],
    });
    groups.push({
      heading: "Platform",
      items: [
        { label: "Users", href: "/admin/users", icon: Users, dataTour: "admin-users" },
        { label: "Accounts", href: "/admin/accounts", icon: Briefcase },
        { label: "API & webhooks", href: "/admin/api", icon: Database },
        {
          label: "Pipedrive",
          href: "/admin/integrations/pipedrive",
          icon: Activity,
        },
      ],
    });
  }

  return groups;
}

export function Sidebar({
  isInternal = false,
  eventId,
  partnerSlug,
  venueSlug,
  collapsed,
  onToggle,
  notificationCount = 0,
  isPartner = false,
}: SidebarProps) {
  const pathname = usePathname();

  const groups = buildGroups({
    isInternal,
    eventId,
    partnerSlug,
    venueSlug,
    isPartner,
    notificationCount,
  });

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-40 flex flex-col",
        "border-r border-border bg-sidebar/80 backdrop-blur-xl",
        "transition-[width] duration-300",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
      style={{ transitionTimingFunction: "var(--bb-ease-emphasized)" }}
      aria-label="Primary navigation"
    >
      <Link
        href="/"
        className={cn(
          "flex h-16 items-center gap-3 border-b border-border px-4",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        )}
      >
        {collapsed ? (
          <BrandMark size="sm" />
        ) : (
          <BrandLockup tagline={resolveScopeTag({ isInternal, isPartner, venueSlug })} />
        )}
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {groups.map((group) => (
          <NavSection
            key={group.heading}
            group={group}
            pathname={pathname}
            collapsed={collapsed}
          />
        ))}
      </nav>

      <div className="border-t border-border p-3 space-y-1">
        <NavLink
          item={{ label: "Settings", href: "/settings", icon: Settings, dataTour: "settings-team" }}
          active={pathname === "/settings"}
          collapsed={collapsed}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex w-full items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5",
            "text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60",
            "transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          )}
        >
          <ChevronsLeft
            size={18}
            className={cn(
              "shrink-0 transition-transform duration-300",
              collapsed && "rotate-180"
            )}
            style={{ transitionTimingFunction: "var(--bb-ease-emphasized)" }}
          />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

function NavSection({
  group,
  pathname,
  collapsed,
}: {
  group: NavGroup;
  pathname: string;
  collapsed: boolean;
}) {
  return (
    <div className="space-y-0.5">
      {!collapsed && (
        <div className="px-3 pb-2 text-overline text-[0.625rem] text-muted-foreground/80">
          {group.heading}
        </div>
      )}
      {group.items.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          active={
            item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`)
          }
          collapsed={collapsed}
        />
      ))}
    </div>
  );
}

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2 text-sm font-medium",
        "transition-all duration-150 border",
        active
          ? "bg-primary/10 text-foreground border-primary/30 shadow-[inset_0_0_0_1px_hsl(230,93%,53%,0.18)]"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border-transparent",
        collapsed && "justify-center px-2"
      )}
      title={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      {...(item.dataTour ? { "data-tour": item.dataTour } : {})}
    >
      {active && (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-x-1.5 -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_12px_hsl(230,93%,53%,0.65)]"
        />
      )}
      <Icon size={17} className="shrink-0" />
      {!collapsed && (
        <>
          <span className="truncate">{item.label}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary/15 px-1.5 text-[0.625rem] font-semibold text-primary">
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

function resolveScopeTag({
  isInternal,
  isPartner,
  venueSlug,
}: {
  isInternal?: boolean;
  isPartner?: boolean;
  venueSlug?: string;
}) {
  if (venueSlug) return "VENUE";
  if (isPartner) return "PARTNER";
  if (isInternal) return "INTERNAL";
  return "PORTAL";
}
