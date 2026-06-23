/**
 * MobileNav — the role-aware navigation drawer for phones/tablets (below `lg`).
 *
 * The desktop {@link InternalNavRail} hides below `lg`, so small screens get
 * this hamburger + Radix Sheet drawer instead. It reuses the exact same
 * destination set via the shared {@link nav-config} so the two never drift,
 * and exposes a "Search" entry that opens the global command palette through a
 * window event (see CommandPalette's `bright:open-command` listener).
 */
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";
import { BrandMark } from "@/components/ui/brand-mark";
import { cn } from "@/lib/utils";
import { internalSectionsForRole, isNavItemActive } from "./nav-config";
import { openCommandPalette } from "./command-palette-bus";
import type { UserRole } from "@/types";

export function MobileNav({ role }: { role: UserRole }) {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = React.useState(false);
  const sections = internalSectionsForRole(role);

  // Close the drawer whenever the route changes.
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open navigation"
          className="lg:hidden fixed left-3 top-3 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Menu size={20} />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[84vw] max-w-xs overflow-y-auto p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>

        <div className="flex items-center gap-2.5 border-b border-border/60 px-5 h-16">
          <BrandMark size="sm" />
          <span className="text-heading text-sm font-semibold text-foreground">
            Bright.Experience
          </span>
        </div>

        <div className="px-3 py-3">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              openCommandPalette();
            }}
            className="flex h-11 w-full items-center gap-3 rounded-[var(--radius-control)] border border-border bg-muted/40 px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-accent"
          >
            <Search size={16} className="shrink-0" />
            <span className="flex-1 truncate">Search or jump to…</span>
          </button>
        </div>

        <nav className="px-2 pb-8 space-y-5">
          {sections.map((section) => (
            <div key={section.heading} className="space-y-1">
              <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70">
                {section.heading}
              </p>
              {section.items.map((item) => {
                const active = isNavItemActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      <Icon size={18} className="shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </SheetClose>
                );
              })}
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
