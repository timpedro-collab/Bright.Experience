/** Profile avatar dropdown — role tag, settings, sign out */
"use client";

import { useRouter } from "next/navigation";
import { Compass, LogOut, Moon, Settings, Sun, User as UserIcon } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User } from "@/types";

const ROLE_LABELS: Record<string, string> = {
  customer_user: "Customer",
  customer_admin: "Customer admin",
  events_lead: "Events lead",
  creative_lead: "Creative lead",
  operations_lead: "Operations lead",
  qa_lead: "QA lead",
  admin: "Administrator",
  partner_member: "Partner",
  partner_admin: "Partner admin",
};

interface UserMenuProps {
  user: User;
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Land on the public home/landing (catalog, quiz, proposal) rather than
    // the bare login screen.
    router.push("/");
    router.refresh();
  }

  function handleStartTour() {
    // Hand off to TourShell, which consumes this one-shot flag on the
    // dashboard ("/") and runs the role-specific tour from the top.
    try {
      localStorage.setItem("bright_tour_pending", "true");
    } catch {
      /* private mode / storage disabled — tour just won't launch */
    }
    router.push("/");
    router.refresh();
  }

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-tour="user-menu"
          className={cn(
            "flex items-center gap-2.5 rounded-[var(--radius-control)] px-1.5 py-1",
            "transition-colors hover:bg-accent",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,hsl(230,93%,53%),hsl(189,100%,75%))] text-xs font-semibold text-white shadow-[0_4px_12px_-4px_hsl(230,93%,53%,0.55)]">
            {initials}
          </span>
          <span className="hidden md:flex flex-col items-start leading-tight">
            <span className="text-sm font-medium text-foreground truncate max-w-[140px]">
              {user.name}
            </span>
            <span className="text-overline text-[0.6rem] text-muted-foreground">
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 border-border bg-popover/95 backdrop-blur-xl"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5 py-1">
            <span className="text-sm font-medium text-foreground truncate">
              {user.name}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {user.email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/settings")}>
          <UserIcon className="size-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/settings")}>
          <Settings className="size-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleStartTour}>
          <Compass className="size-4" />
          Take the tour
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            toggleTheme();
          }}
        >
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          {isDark ? "Switch to light" : "Switch to dark"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={handleSignOut}
          className="text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
