/** Application-wide Cmd+K command palette — global navigation, quick actions, and live search. */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, CalendarCheck, Sparkles, BarChart3, Bell, Settings,
  Users, Handshake, Building2, Lightbulb, Key, Layers, FileText, MapPin,
  ArrowUpRight, Search, CheckSquare, Loader2, Inbox, GitBranch, Clock,
  Receipt, Gauge,
} from "lucide-react";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem,
  CommandList, CommandSeparator, CommandShortcut,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import {
  canViewCreativeQueue,
  canViewCommercial,
  canViewCreativeProduct,
  canViewLocations,
} from "@/lib/roles";
import type { UserRole } from "@/types";

interface SearchResults {
  events: { id: string; name: string; accountName: string | null }[];
  accounts: { id: string; name: string }[];
  tasks: { id: string; title: string; eventId: string; eventName: string | null; targetPath: string }[];
}

interface CommandPaletteProps {
  isInternal?: boolean;
  /** Viewer role — lets us scope admin shortcuts to the roles that own them. */
  role?: UserRole;
  partnerSlug?: string;
  venueSlug?: string;
  eventId?: string;
}

export function CommandPalette({ isInternal, role, partnerSlug, venueSlug, eventId }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

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

  const fetchResults = useCallback((q: string) => {
    clearTimeout(debounceRef.current);
    if (q.length < 2) { setResults(null); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (res.ok) setResults(await res.json());
      } catch { /* network error — silent */ }
      setLoading(false);
    }, 300);
  }, []);

  function onQueryChange(value: string) {
    setQuery(value);
    fetchResults(value);
  }

  function go(href: string) { setOpen(false); setQuery(""); setResults(null); router.push(href); }

  const hasResults = results && (results.events.length || results.accounts.length || results.tasks.length);
  const showStatic = query.length < 2;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Open command palette" data-tour="command-palette"
        className="hidden lg:flex h-9 w-full max-w-md items-center gap-3 rounded-[var(--radius-control)] border border-border bg-muted/40 px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 truncate">Search or jump to…</span>
        <span className="flex items-center gap-1"><Kbd>⌘</Kbd><Kbd>K</Kbd></span>
      </button>
      <button type="button" onClick={() => setOpen(true)} aria-label="Open command palette"
        className="lg:hidden flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-border bg-muted/40 text-muted-foreground transition-colors hover:bg-accent">
        <ArrowUpRight className="h-4 w-4" />
      </button>

      <CommandDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setQuery(""); setResults(null); } }}>
        <CommandInput placeholder="Search events, partners, settings…" value={query} onValueChange={onQueryChange} />
        <CommandList>
          {loading && <div className="py-6 text-center text-sm text-muted-foreground"><Loader2 className="inline h-4 w-4 animate-spin mr-2" />Searching…</div>}

          {!loading && !showStatic && !hasResults && <CommandEmpty>No results found.</CommandEmpty>}

          {!loading && hasResults && (
            <>
              {results.events.length > 0 && (
                <CommandGroup heading="Events">
                  {results.events.map((e) => (
                    <CommandItem key={e.id} onSelect={() => go(`/events/${e.id}`)}>
                      <CalendarCheck /><span>{e.name}</span>
                      {e.accountName && <span className="ml-auto text-xs text-muted-foreground">{e.accountName}</span>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {results.accounts.length > 0 && (
                <CommandGroup heading="Accounts">
                  {results.accounts.map((a) => (
                    <CommandItem key={a.id} onSelect={() => go("/admin/accounts")}>
                      <Building2 /><span>{a.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {results.tasks.length > 0 && (
                <CommandGroup heading="Tasks">
                  {results.tasks.map((t) => (
                    <CommandItem key={t.id} onSelect={() => go(`/events/${t.eventId}/${t.targetPath}`)}>
                      <CheckSquare /><span>{t.title}</span>
                      {t.eventName && <span className="ml-auto text-xs text-muted-foreground">{t.eventName}</span>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}

          {showStatic && <StaticGroups go={go} isInternal={isInternal} role={role} eventId={eventId} partnerSlug={partnerSlug} venueSlug={venueSlug} />}
        </CommandList>
      </CommandDialog>
    </>
  );
}

function StaticGroups({ go, isInternal, role, eventId, partnerSlug, venueSlug }: { go: (h: string) => void; isInternal?: boolean; role?: UserRole; eventId?: string; partnerSlug?: string; venueSlug?: string }) {
  // When we know the role, scope ownership-specific shortcuts. When we
  // don't (legacy call sites), fall back to showing them to any internal
  // user — the destination pages still enforce their own guards.
  const isAdmin = role === "admin" || role === "developer";
  const canCreativeQueue = role ? canViewCreativeQueue(role) : true;
  // Commercial / account-management surfaces (quotes, invoices, customers,
  // templates, campaigns, benchmarks, recommendations, partners).
  const canCommercial = role ? canViewCommercial(role) : true;
  // Creative / product back-office (catalog + Studio orders).
  const canCreativeProduct = role ? canViewCreativeProduct(role) : true;
  // Locations (venues / delivery) — logistics-adjacent.
  const canLocations = role ? canViewLocations(role) : true;
  return (
    <>
      <CommandGroup heading="Workspace">
        <CommandItem onSelect={() => go("/")}><LayoutDashboard /><span>{isInternal ? "All Events" : "My Events"}</span><CommandShortcut>G E</CommandShortcut></CommandItem>
        <CommandItem onSelect={() => go("/notifications")}><Bell /><span>Notifications</span><CommandShortcut>G N</CommandShortcut></CommandItem>
        <CommandItem onSelect={() => go("/settings")}><Settings /><span>Settings</span></CommandItem>
      </CommandGroup>

      {eventId && (<><CommandSeparator /><CommandGroup heading="This event">
        <CommandItem onSelect={() => go(`/events/${eventId}`)}><CalendarCheck /><span>Overview</span></CommandItem>
        <CommandItem onSelect={() => go(`/events/${eventId}/timeline`)}><CalendarCheck /><span>Timeline</span></CommandItem>
        <CommandItem onSelect={() => go(`/events/${eventId}/actions`)}><FileText /><span>Actions</span></CommandItem>
        <CommandItem onSelect={() => go(`/events/${eventId}/assets`)}><FileText /><span>Assets</span></CommandItem>
        <CommandItem onSelect={() => go(`/events/${eventId}/live`)}><BarChart3 /><span>Live dashboard</span></CommandItem>
        <CommandItem onSelect={() => go(`/events/${eventId}/reports`)}><BarChart3 /><span>Reports</span></CommandItem>
      </CommandGroup></>)}

      {partnerSlug && (<><CommandSeparator /><CommandGroup heading="Partner">
        <CommandItem onSelect={() => go(`/partners/${partnerSlug}/dashboard`)}><Handshake /><span>Partner dashboard</span></CommandItem>
        <CommandItem onSelect={() => go(`/partners/${partnerSlug}/clients`)}><Users /><span>Clients</span></CommandItem>
        <CommandItem onSelect={() => go(`/partners/${partnerSlug}/quotes`)}><FileText /><span>Quotes</span></CommandItem>
        <CommandItem onSelect={() => go(`/partners/${partnerSlug}/commissions`)}><FileText /><span>Commissions</span></CommandItem>
        <CommandItem onSelect={() => go(`/partners/${partnerSlug}/resources`)}><FileText /><span>Resources</span></CommandItem>
      </CommandGroup></>)}

      {venueSlug && (<><CommandSeparator /><CommandGroup heading="Venue">
        <CommandItem onSelect={() => go(`/venues/${venueSlug}/dashboard`)}><Building2 /><span>Venue dashboard</span></CommandItem>
        <CommandItem onSelect={() => go(`/venues/${venueSlug}/placements`)}><MapPin /><span>Placements</span></CommandItem>
        <CommandItem onSelect={() => go(`/venues/${venueSlug}/sponsorships`)}><Sparkles /><span>Sponsorships</span></CommandItem>
        <CommandItem onSelect={() => go(`/venues/${venueSlug}/packages`)}><Layers /><span>Packages</span></CommandItem>
      </CommandGroup></>)}

      {isInternal && (<><CommandSeparator /><CommandGroup heading="Admin">
        <CommandItem onSelect={() => go("/ops")}><Gauge /><span>Command center</span></CommandItem>
        <CommandItem onSelect={() => go("/inbox")}><Inbox /><span>Inbox</span></CommandItem>
        <CommandItem onSelect={() => go("/pipeline")}><GitBranch /><span>Pipeline</span></CommandItem>
        {canCreativeQueue && <CommandItem onSelect={() => go("/admin/asset-reviews")}><CheckSquare /><span>Asset reviews</span></CommandItem>}
        {canCommercial && <CommandItem onSelect={() => go("/admin/customer-queue")}><Clock /><span>Customer queue</span></CommandItem>}
        {canCommercial && <CommandItem onSelect={() => go("/admin/invoices")}><Receipt /><span>Invoices</span></CommandItem>}
        {canCreativeProduct && <CommandItem onSelect={() => go("/studio")}><Sparkles /><span>Studio orders</span></CommandItem>}
        {canCommercial && <CommandItem onSelect={() => go("/admin/quotes")}><FileText /><span>Quotes pipeline</span></CommandItem>}
        {canCommercial && <CommandItem onSelect={() => go("/admin/partners")}><Handshake /><span>Partners</span></CommandItem>}
        {canCommercial && <CommandItem onSelect={() => go("/admin/campaigns")}><Layers /><span>Campaigns</span></CommandItem>}
        {canCommercial && <CommandItem onSelect={() => go("/admin/templates")}><FileText /><span>Templates</span></CommandItem>}
        {canCreativeProduct && <CommandItem onSelect={() => go("/admin/catalog")}><Sparkles /><span>Catalog</span></CommandItem>}
        {canLocations && <CommandItem onSelect={() => go("/admin/locations")}><MapPin /><span>Locations</span></CommandItem>}
        {canCommercial && <CommandItem onSelect={() => go("/admin/benchmarks")}><BarChart3 /><span>Benchmarks</span></CommandItem>}
        {canCommercial && <CommandItem onSelect={() => go("/admin/recommendations")}><Lightbulb /><span>Recommendations</span></CommandItem>}
        {isAdmin && <CommandItem onSelect={() => go("/admin/api")}><Key /><span>API & integrations</span></CommandItem>}
      </CommandGroup></>)}

      <CommandSeparator />
      <CommandGroup heading="Public">
        <CommandItem onSelect={() => go("/catalog")}><Sparkles /><span>Catalog</span></CommandItem>
        <CommandItem onSelect={() => go("/quiz")}><Lightbulb /><span>Find your match</span></CommandItem>
        <CommandItem onSelect={() => go("/book")}><FileText /><span>Book now</span></CommandItem>
        <CommandItem onSelect={() => go("/proposal")}><FileText /><span>Get a proposal</span></CommandItem>
      </CommandGroup>
    </>
  );
}
