/**
 * Tab switcher for creative and ops briefing forms.
 * URL-param driven so tabs are shareable / back-navigable.
 */
"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Palette, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "creative", label: "Creative", icon: Palette },
  { id: "ops", label: "Operations", icon: Wrench },
] as const;

export type BriefingTab = (typeof TABS)[number]["id"];

export function BriefingTabs() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const active = (searchParams.get("tab") as BriefingTab) || "creative";

  function setTab(tab: BriefingTab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-1 p-1 rounded-[var(--radius-card)] bg-muted/40 border border-border/60 w-fit">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setTab(id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-[calc(var(--radius-card)-4px)] text-sm font-medium transition-all",
            active === id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  );
}
