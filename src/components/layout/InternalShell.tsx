/**
 * InternalShell — decides, per route, whether to wrap the page in the
 * persistent nav rail. The root layout only renders this for internal users,
 * but we still keep the rail off the public/editorial surfaces (login,
 * marketing, catalog, quiz, proposal) and the partner/venue portals so those
 * immersive experiences stay full-bleed. Internal app routes (home cockpit,
 * pipeline, inbox, studio, admin, events) get the rail.
 */
"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { InternalNavRail } from "./InternalNavRail";
import { MobileNav } from "./MobileNav";
import type { UserRole } from "@/types";

const RAIL_PREFIXES = [
  "/ops",
  "/pipeline",
  "/inbox",
  "/studio",
  "/notifications",
  "/settings",
  "/admin",
  "/events",
];

function showRailFor(pathname: string): boolean {
  if (pathname === "/") return true;
  return RAIL_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function InternalShell({
  role,
  children,
}: {
  role: UserRole;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "/";

  if (!showRailFor(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <InternalNavRail role={role} />
      <MobileNav role={role} />
      <div className="min-w-0 flex-1 max-lg:pt-14">{children}</div>
    </div>
  );
}
