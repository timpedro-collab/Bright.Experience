/** Horizontal tab bar for portal (partner / venue) section navigation. */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export interface PortalTab {
  label: string;
  href: string;
}

export function PortalTabNav({ tabs }: { tabs: PortalTab[] }) {
  const pathname = usePathname();

  return (
    <nav
      className="overflow-x-auto -mx-[var(--edition-px,1.5rem)]"
      aria-label="Portal sections"
    >
      <div className="flex min-w-max items-center gap-1 px-[var(--edition-px,1.5rem)] py-1">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
