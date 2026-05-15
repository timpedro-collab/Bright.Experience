/** Application-wide Cmd+K command palette — global navigation & quick actions */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  Sparkles,
  BarChart3,
  Bell,
  Settings,
  Users,
  Handshake,
  Building2,
  Lightbulb,
  Key,
  Layers,
  FileText,
  MapPin,
  ArrowUpRight,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";

interface CommandPaletteProps {
  isInternal?: boolean;
  partnerSlug?: string;
  venueSlug?: string;
  eventId?: string;
}

export function CommandPalette({
  isInternal,
  partnerSlug,
  venueSlug,
  eventId,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open command palette"
        className="hidden lg:flex h-9 w-full max-w-md items-center gap-3 rounded-[var(--radius-control)] border border-white/8 bg-white/[0.03] px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-white/[0.05] hover:border-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 truncate">Search or jump to…</span>
        <span className="flex items-center gap-1">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open command palette"
        className="lg:hidden flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-white/8 bg-white/[0.03] text-muted-foreground transition-colors hover:bg-white/[0.05]"
      >
        <ArrowUpRight className="h-4 w-4" />
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search events, partners, settings…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Workspace">
            <CommandItem onSelect={() => go("/")}>
              <LayoutDashboard />
              <span>{isInternal ? "All Events" : "My Events"}</span>
              <CommandShortcut>G E</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => go("/notifications")}>
              <Bell />
              <span>Notifications</span>
              <CommandShortcut>G N</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => go("/settings")}>
              <Settings />
              <span>Settings</span>
            </CommandItem>
          </CommandGroup>

          {eventId && (
            <>
              <CommandSeparator />
              <CommandGroup heading="This event">
                <CommandItem onSelect={() => go(`/events/${eventId}`)}>
                  <CalendarCheck />
                  <span>Overview</span>
                </CommandItem>
                <CommandItem onSelect={() => go(`/events/${eventId}/timeline`)}>
                  <CalendarCheck />
                  <span>Timeline</span>
                </CommandItem>
                <CommandItem onSelect={() => go(`/events/${eventId}/actions`)}>
                  <FileText />
                  <span>Actions</span>
                </CommandItem>
                <CommandItem onSelect={() => go(`/events/${eventId}/assets`)}>
                  <FileText />
                  <span>Assets</span>
                </CommandItem>
                <CommandItem onSelect={() => go(`/events/${eventId}/live`)}>
                  <BarChart3 />
                  <span>Live dashboard</span>
                </CommandItem>
                <CommandItem onSelect={() => go(`/events/${eventId}/reports`)}>
                  <BarChart3 />
                  <span>Reports</span>
                </CommandItem>
              </CommandGroup>
            </>
          )}

          {partnerSlug && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Partner">
                <CommandItem onSelect={() => go(`/partners/${partnerSlug}/dashboard`)}>
                  <Handshake />
                  <span>Partner dashboard</span>
                </CommandItem>
                <CommandItem onSelect={() => go(`/partners/${partnerSlug}/clients`)}>
                  <Users />
                  <span>Clients</span>
                </CommandItem>
                <CommandItem onSelect={() => go(`/partners/${partnerSlug}/quotes`)}>
                  <FileText />
                  <span>Quotes</span>
                </CommandItem>
                <CommandItem onSelect={() => go(`/partners/${partnerSlug}/commissions`)}>
                  <FileText />
                  <span>Commissions</span>
                </CommandItem>
                <CommandItem onSelect={() => go(`/partners/${partnerSlug}/resources`)}>
                  <FileText />
                  <span>Resources</span>
                </CommandItem>
              </CommandGroup>
            </>
          )}

          {venueSlug && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Venue">
                <CommandItem onSelect={() => go(`/venues/${venueSlug}/dashboard`)}>
                  <Building2 />
                  <span>Venue dashboard</span>
                </CommandItem>
                <CommandItem onSelect={() => go(`/venues/${venueSlug}/placements`)}>
                  <MapPin />
                  <span>Placements</span>
                </CommandItem>
                <CommandItem onSelect={() => go(`/venues/${venueSlug}/sponsorships`)}>
                  <Sparkles />
                  <span>Sponsorships</span>
                </CommandItem>
                <CommandItem onSelect={() => go(`/venues/${venueSlug}/packages`)}>
                  <Layers />
                  <span>Packages</span>
                </CommandItem>
              </CommandGroup>
            </>
          )}

          {isInternal && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Admin">
                <CommandItem onSelect={() => go("/studio")}>
                  <Sparkles />
                  <span>Studio orders</span>
                </CommandItem>
                <CommandItem onSelect={() => go("/admin/quotes")}>
                  <FileText />
                  <span>Quotes pipeline</span>
                </CommandItem>
                <CommandItem onSelect={() => go("/admin/partners")}>
                  <Handshake />
                  <span>Partners</span>
                </CommandItem>
                <CommandItem onSelect={() => go("/admin/campaigns")}>
                  <Layers />
                  <span>Campaigns</span>
                </CommandItem>
                <CommandItem onSelect={() => go("/admin/templates")}>
                  <FileText />
                  <span>Templates</span>
                </CommandItem>
                <CommandItem onSelect={() => go("/admin/catalog")}>
                  <Sparkles />
                  <span>Catalog</span>
                </CommandItem>
                <CommandItem onSelect={() => go("/admin/locations")}>
                  <MapPin />
                  <span>Locations</span>
                </CommandItem>
                <CommandItem onSelect={() => go("/admin/benchmarks")}>
                  <BarChart3 />
                  <span>Benchmarks</span>
                </CommandItem>
                <CommandItem onSelect={() => go("/admin/recommendations")}>
                  <Lightbulb />
                  <span>Recommendations</span>
                </CommandItem>
                <CommandItem onSelect={() => go("/admin/api")}>
                  <Key />
                  <span>API & integrations</span>
                </CommandItem>
              </CommandGroup>
            </>
          )}

          <CommandSeparator />
          <CommandGroup heading="Public">
            <CommandItem onSelect={() => go("/catalog")}>
              <Sparkles />
              <span>Catalog</span>
            </CommandItem>
            <CommandItem onSelect={() => go("/quiz")}>
              <Lightbulb />
              <span>Find your match</span>
            </CommandItem>
            <CommandItem onSelect={() => go("/book")}>
              <FileText />
              <span>Book now</span>
            </CommandItem>
            <CommandItem onSelect={() => go("/proposal")}>
              <FileText />
              <span>Get a proposal</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
