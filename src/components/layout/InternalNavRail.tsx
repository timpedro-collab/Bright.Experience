/**
 * InternalNavRail — the persistent left navigation for Bright.Blue staff.
 *
 * Mounted once in the root layout for internal roles, so it never unmounts
 * between route changes (state + scroll persist). Mirrors the role-gated
 * destination set from the ⌘K command palette, grouped into sections, and
 * collapses to an icon rail. Below `lg` it hides entirely — small screens
 * keep using the command palette + top chrome.
 */
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { BrandMark } from "@/components/ui/brand-mark";
import { cn } from "@/lib/utils";
import { internalSectionsForRole, isNavItemActive as isActive } from "./nav-config";
import type { UserRole } from "@/types";

const STORAGE_KEY = "bright_nav_collapsed";

export function InternalNavRail({ role }: { role: UserRole }) {
  const pathname = usePathname() ?? "/";
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* storage disabled — stay expanded */
    }
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const sections = internalSectionsForRole(role);

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "hidden lg:flex sticky top-0 h-screen shrink-0 flex-col border-r border-border bg-card/60 backdrop-blur-sm transition-[width] duration-200",
        collapsed ? "w-16" : "w-60",
      )}
      aria-label="Primary"
    >
      {/* Brand */}
      <Link
        href="/"
        className={cn(
          "flex items-center gap-2.5 px-3 h-16 shrink-0 border-b border-border/60",
          collapsed && "justify-center px-0",
        )}
      >
        <BrandMark size="sm" />
        {!collapsed && (
          <span className="text-heading text-sm font-semibold text-foreground truncate">
            Bright.Experience
          </span>
        )}
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-5">
        {sections.map((section) => (
          <div key={section.heading} className="space-y-1">
            {!collapsed && (
              <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70">
                {section.heading}
              </p>
            )}
            {section.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-tour={`nav:${item.href}`}
                  title={collapsed ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2 text-sm transition-colors",
                    collapsed && "justify-center px-0",
                    active
                      ? "chip-brand-gradient font-medium shadow-[0_8px_20px_-8px_rgba(24,62,246,0.65)]"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {active && (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-white/70"
                    />
                  )}
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        className={cn(
          "flex items-center gap-3 border-t border-border/60 px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
          collapsed && "justify-center px-0",
        )}
      >
        {collapsed ? (
          <PanelLeftOpen size={18} className="shrink-0" />
        ) : (
          <>
            <PanelLeftClose size={18} className="shrink-0" />
            <span>Collapse</span>
          </>
        )}
      </button>
    </aside>
  );
}
