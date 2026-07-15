/**
 * Application-wide Cmd+K command palette — global navigation, quick
 * actions, live search, and a Recent group of previously searched
 * destinations. Also owns the global keyboard shortcuts: G-then-E/N/I
 * navigation sequences and the "?" shortcuts overlay.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, CalendarCheck, Sparkles, BarChart3, Bell, Settings,
  Users, Handshake, Building2, Lightbulb, Key, Layers, FileText, MapPin,
  ArrowUpRight, CheckSquare, Loader2, Inbox, GitBranch, Clock,
  Receipt, Search, Plus, UserPlus, History,
} from "lucide-react";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem,
  CommandList, CommandSeparator, CommandShortcut,
} from "@/components/ui/command";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import {
  canViewCreativeQueue,
  canViewCommercial,
  canViewCreativeProduct,
  canViewLocations,
} from "@/lib/roles";
import {
  getPaletteRecents,
  pushPaletteRecent,
  type PaletteRecent,
} from "@/lib/palette-recents";
import { onOpenCommandPalette } from "./command-palette-bus";
import type { UserRole } from "@/types";

/** True when the key event originated inside a text-entry control. */
function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || !el.tagName) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable
  );
}

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
  const [recents, setRecents] = useState<PaletteRecent[]>([]);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Timestamp of the last bare "g" press — arms the G-then-X sequence.
  const lastGRef = useRef(0);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        // Refresh recents in the same tick — harmless when closing.
        setRecents(getPaletteRecents());
        setOpen((v) => !v);
        return;
      }

      // Bare-key shortcuts never fire from text inputs or with modifiers.
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditableTarget(e.target)) return;

      if (e.key === "?") {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      // G-then-X navigation: press G, then the destination key within 1.5s.
      if (e.key === "g" || e.key === "G") {
        lastGRef.current = Date.now();
        return;
      }
      if (Date.now() - lastGRef.current < 1500) {
        const key = e.key.toLowerCase();
        if (key === "e") {
          e.preventDefault();
          router.push("/");
        } else if (key === "n") {
          e.preventDefault();
          router.push("/notifications");
        } else if (key === "i" && isInternal) {
          e.preventDefault();
          router.push("/inbox");
        }
        lastGRef.current = 0;
      }
    }
    document.addEventListener("keydown", onKey);
    const unsubscribe = onOpenCommandPalette(() => {
      setRecents(getPaletteRecents());
      setOpen(true);
    });
    return () => {
      document.removeEventListener("keydown", onKey);
      unsubscribe();
    };
  }, [router, isInternal]);

  /** Open the palette with a fresh Recent group. */
  function openPalette() {
    setRecents(getPaletteRecents());
    setOpen(true);
  }

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

  function go(href: string, label?: string) {
    if (label) pushPaletteRecent({ href, label });
    setOpen(false);
    setQuery("");
    setResults(null);
    router.push(href);
  }

  const hasResults = results && (results.events.length || results.accounts.length || results.tasks.length);
  const showStatic = query.length < 2;

  return (
    <>
      <button type="button" onClick={openPalette} aria-label="Open command palette" data-tour="command-palette"
        className="hidden lg:flex h-9 w-full max-w-md items-center gap-3 rounded-[var(--radius-control)] border border-border bg-muted/40 px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 truncate">Search or jump to…</span>
        <span className="flex items-center gap-1"><Kbd>⌘</Kbd><Kbd>K</Kbd></span>
      </button>
      <button type="button" onClick={openPalette} aria-label="Open command palette"
        className="lg:hidden fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-primary text-primary-foreground shadow-lg transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Search className="h-5 w-5" />
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
                    <CommandItem key={e.id} onSelect={() => go(`/events/${e.id}`, e.name)}>
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
                    <CommandItem key={t.id} onSelect={() => go(`/events/${t.eventId}/${t.targetPath}`, t.title)}>
                      <CheckSquare /><span>{t.title}</span>
                      {t.eventName && <span className="ml-auto text-xs text-muted-foreground">{t.eventName}</span>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}

          {showStatic && (
            <>
              {recents.length > 0 && (
                <CommandGroup heading="Recent">
                  {recents.map((r) => (
                    <CommandItem key={r.href} onSelect={() => go(r.href, r.label)}>
                      <History /><span>{r.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              <StaticGroups go={go} isInternal={isInternal} role={role} eventId={eventId} partnerSlug={partnerSlug} venueSlug={venueSlug} />
            </>
          )}
        </CommandList>
      </CommandDialog>

      <ShortcutsOverlay
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
        isInternal={isInternal}
      />
    </>
  );
}

/** "?" overlay — the keyboard shortcuts the app actually honours. */
function ShortcutsOverlay({
  open,
  onOpenChange,
  isInternal,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isInternal?: boolean;
}) {
  const rows: { keys: string[]; label: string }[] = [
    { keys: ["⌘", "K"], label: "Search & commands" },
    { keys: ["G", "E"], label: isInternal ? "Go to command center" : "Go to my events" },
    { keys: ["G", "N"], label: "Go to notifications" },
    ...(isInternal ? [{ keys: ["G", "I"], label: "Go to inbox" }] : []),
    { keys: ["?"], label: "Show this overlay" },
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        <ul className="mt-1 space-y-2.5">
          {rows.map((row) => (
            <li key={row.label} className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span className="flex items-center gap-1">
                {row.keys.map((k, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && row.keys[0] === "G" && (
                      <span className="text-[0.6rem] text-muted-foreground">then</span>
                    )}
                    <Kbd>{k}</Kbd>
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          Sequences: press the first key, then the second within a moment.
        </p>
      </DialogContent>
    </Dialog>
  );
}

function StaticGroups({ go, isInternal, role, eventId, partnerSlug, venueSlug }: { go: (h: string, label?: string) => void; isInternal?: boolean; role?: UserRole; eventId?: string; partnerSlug?: string; venueSlug?: string }) {
  // When we know the role, scope ownership-specific shortcuts. When we
  // don't (legacy call sites), fall back to showing them to any internal
  // user — the destination pages still enforce their own guards.
  const isAdmin = role === "admin";
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
        <CommandItem onSelect={() => go("/")}><LayoutDashboard /><span>{isInternal ? "Command center" : "My Events"}</span><CommandShortcut>G E</CommandShortcut></CommandItem>
        <CommandItem onSelect={() => go("/notifications")}><Bell /><span>Notifications</span><CommandShortcut>G N</CommandShortcut></CommandItem>
        <CommandItem onSelect={() => go("/settings")}><Settings /><span>Settings</span></CommandItem>
      </CommandGroup>

      {isInternal && (<><CommandSeparator /><CommandGroup heading="Quick actions">
        <CommandItem onSelect={() => go("/events/new", "New event")}><Plus /><span>Create a new event</span></CommandItem>
        {canCommercial && <CommandItem onSelect={() => go("/admin/invites", "Invite a customer")}><UserPlus /><span>Invite a customer</span></CommandItem>}
        <CommandItem onSelect={() => go("/settings/team", "Team settings")}><Users /><span>Invite a teammate</span></CommandItem>
      </CommandGroup></>)}

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
        <CommandItem onSelect={() => go("/inbox", "Inbox")}><Inbox /><span>Inbox</span><CommandShortcut>G I</CommandShortcut></CommandItem>
        <CommandItem onSelect={() => go("/pipeline", "Pipeline")}><GitBranch /><span>Pipeline</span></CommandItem>
        {canCreativeQueue && <CommandItem onSelect={() => go("/admin/asset-reviews", "Asset reviews")}><CheckSquare /><span>Asset reviews</span></CommandItem>}
        {canCommercial && <CommandItem onSelect={() => go("/admin/customer-queue", "Customer queue")}><Clock /><span>Customer queue</span></CommandItem>}
        {canCommercial && <CommandItem onSelect={() => go("/admin/invoices", "Invoices")}><Receipt /><span>Invoices</span></CommandItem>}
        {canCreativeProduct && <CommandItem onSelect={() => go("/studio", "Studio orders")}><Sparkles /><span>Studio orders</span></CommandItem>}
        {canCommercial && <CommandItem onSelect={() => go("/admin/quotes", "Quotes pipeline")}><FileText /><span>Quotes pipeline</span></CommandItem>}
        {canCommercial && <CommandItem onSelect={() => go("/admin/partners", "Partners")}><Handshake /><span>Partners</span></CommandItem>}
        {canCommercial && <CommandItem onSelect={() => go("/admin/campaigns", "Campaigns")}><Layers /><span>Campaigns</span></CommandItem>}
        {canCommercial && <CommandItem onSelect={() => go("/admin/templates", "Templates")}><FileText /><span>Templates</span></CommandItem>}
        {canCreativeProduct && <CommandItem onSelect={() => go("/admin/catalog", "Catalog")}><Sparkles /><span>Catalog</span></CommandItem>}
        {canLocations && <CommandItem onSelect={() => go("/admin/locations", "Locations")}><MapPin /><span>Locations</span></CommandItem>}
        {canCommercial && <CommandItem onSelect={() => go("/admin/benchmarks", "Benchmarks")}><BarChart3 /><span>Benchmarks</span></CommandItem>}
        {canCommercial && <CommandItem onSelect={() => go("/admin/recommendations", "Recommendations")}><Lightbulb /><span>Recommendations</span></CommandItem>}
        {isAdmin && <CommandItem onSelect={() => go("/admin/api", "API & integrations")}><Key /><span>API & integrations</span></CommandItem>}
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
