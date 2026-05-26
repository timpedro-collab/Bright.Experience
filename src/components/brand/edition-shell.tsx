/**
 * EditionShell — the canonical Bright.Experience page chrome.
 *
 * Every Bright.Experience surface composes from the same four pieces:
 *
 *   ┌───────────────────────────────────────────────────────────────┐
 *   │ <EditionChrome>      brand mark · breadcrumbs · right slot    │
 *   ├───────────────────────────────────────────────────────────────┤
 *   │                                                               │
 *   │ <RidgeHero>          full-bleed ridge artwork with title      │
 *   │                                                               │
 *   ├───────────────────────────────────────────────────────────────┤
 *   │                                                               │
 *   │ <EditionShell.Body>  page content (three-column, list, etc.)  │
 *   │                                                               │
 *   ├───────────────────────────────────────────────────────────────┤
 *   │ <EditionFooter>      bright.blue locations · ⌘K · next page   │
 *   └───────────────────────────────────────────────────────────────┘
 *
 * The shell is theme-aware: pass `theme="light"` to swap the entire
 * subtree into Linen mode. Theme switching is just a class on the
 * outer div — all child surfaces inherit through CSS variables.
 */
import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLockup } from "@/components/ui/brand-mark";
import { Hairline } from "./editorial";
import { RidgeArtwork } from "./ridge-artwork";

// ─── EditionShell (theme wrapper) ────────────────────────────────────────

export type EditionTheme = "dark" | "light";

interface EditionShellProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Which palette to render this subtree in. Defaults to the global
   * theme (dark / deep ink). Editorial / customer-facing surfaces tend
   * to use `light` (linen), operational surfaces use `dark` (deep ink).
   */
  theme?: EditionTheme;
}

export function EditionShell({
  theme = "dark",
  className,
  children,
  ...props
}: EditionShellProps) {
  return (
    <div
      className={cn(
        theme === "light" ? "theme-light" : "",
        "min-h-screen bg-background text-foreground",
        className,
      )}
      data-theme={theme}
      {...props}
    >
      <div className="mx-auto max-w-[1320px] px-6 lg:px-10 pt-6 pb-12">
        {children}
      </div>
    </div>
  );
}

// ─── Top chrome ──────────────────────────────────────────────────────────

export interface EditionBreadcrumb {
  label: string;
  href?: string;
}

interface EditionChromeProps {
  breadcrumbs?: EditionBreadcrumb[];
  /** Slot rendered on the far right (user pill, status, time). */
  rightSlot?: React.ReactNode;
  /** Override the brand lockup (rare). */
  lockup?: React.ReactNode;
  className?: string;
}

export function EditionChrome({
  breadcrumbs,
  rightSlot,
  lockup,
  className,
}: EditionChromeProps) {
  return (
    <>
      <header
        className={cn(
          "flex items-center justify-between gap-6 py-3",
          className,
        )}
      >
        <div className="flex items-center gap-6 min-w-0">
          {lockup ?? <BrandLockup size="sm" />}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav
              aria-label="Breadcrumb"
              className="hidden md:flex items-center gap-2 text-overline text-muted-foreground min-w-0"
            >
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={`${crumb.label}-${idx}`}>
                  {idx > 0 && (
                    <ChevronRight
                      className="size-3 shrink-0 opacity-50"
                      aria-hidden
                    />
                  )}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="hover:text-foreground transition-colors truncate"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      className={cn(
                        "truncate",
                        idx === breadcrumbs.length - 1 && "text-foreground",
                      )}
                    >
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}
        </div>
        {rightSlot && (
          <div className="flex items-center gap-3 text-overline text-muted-foreground shrink-0">
            {rightSlot}
          </div>
        )}
      </header>
      <Hairline className="opacity-70" />
    </>
  );
}

// ─── Ridge Hero ──────────────────────────────────────────────────────────

interface RidgeHeroProps {
  seed: string;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Right-aligned status slot (e.g. "On track · 26 days · 06 hours"). */
  rightSlot?: React.ReactNode;
  /** Visual density of the ridges. */
  lines?: number;
  amplitude?: number;
  /** Hide the cyan hero thread (rare). */
  showHeroThread?: boolean;
  /** Custom height of the artwork band, in CSS units. */
  artworkHeight?: string;
  className?: string;
}

export function RidgeHero({
  seed,
  eyebrow,
  title,
  subtitle,
  rightSlot,
  lines = 28,
  amplitude = 90,
  showHeroThread = true,
  artworkHeight = "clamp(280px, 36vw, 480px)",
  className,
}: RidgeHeroProps) {
  return (
    <section
      className={cn("relative isolate overflow-hidden", className)}
      aria-labelledby="ridge-hero-title"
    >
      <div
        className="absolute inset-x-0 top-0 ridge-color-cobalt"
        style={{ height: artworkHeight }}
      >
        <RidgeArtwork
          seed={seed}
          lines={lines}
          amplitude={amplitude}
          showHeroThread={showHeroThread}
          className="text-[hsl(223,94%,53%)]"
        />
        {/* Soft gradient fade at the bottom so the overlaid title sits
            calmly on the artwork without harsh visual conflict. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent"
        />
      </div>
      <div
        className="relative flex flex-col justify-end"
        style={{ minHeight: artworkHeight }}
      >
        <div className="flex items-end justify-between gap-8 pt-12 pb-6">
          <div className="max-w-[64ch]">
            {eyebrow && (
              <div className="text-overline text-muted-foreground mb-3">
                {eyebrow}
              </div>
            )}
            <h1
              id="ridge-hero-title"
              className="text-display text-foreground text-[clamp(2.5rem,5.5vw,4.5rem)]"
            >
              {title}
            </h1>
            {subtitle && (
              <p className="mt-3 text-base text-muted-foreground max-w-[52ch]">
                {subtitle}
              </p>
            )}
          </div>
          {rightSlot && (
            <div className="hidden md:flex flex-col items-end gap-1 text-overline text-foreground shrink-0">
              {rightSlot}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Body wrapper ────────────────────────────────────────────────────────

interface EditionBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Add the standard hairline above the body. */
  withTopHairline?: boolean;
  /** Add the standard hairline below the body. */
  withBottomHairline?: boolean;
}

export function EditionBody({
  withTopHairline = true,
  withBottomHairline = true,
  className,
  children,
  ...props
}: EditionBodyProps) {
  return (
    <>
      {withTopHairline && <Hairline className="opacity-60" />}
      <div className={cn("py-8", className)} {...props}>
        {children}
      </div>
      {withBottomHairline && <Hairline className="opacity-60" />}
    </>
  );
}

// ─── Three-column body (the editorial workhorse) ─────────────────────────

interface ThreeColumnProps extends React.HTMLAttributes<HTMLDivElement> {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
}

export function ThreeColumn({
  left,
  center,
  right,
  className,
  ...props
}: ThreeColumnProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-8 md:divide-x divide-border",
        className,
      )}
      {...props}
    >
      <div className="md:pr-8">{left}</div>
      <div className="md:px-8">{center}</div>
      <div className="md:pl-8">{right}</div>
    </div>
  );
}

// ─── Footer band ─────────────────────────────────────────────────────────

interface EditionFooterProps {
  /** Right-hand small CTA — e.g. "Open the queue →". */
  rightSlot?: React.ReactNode;
  /**
   * Bright.Blue locations to display. Defaults to the canonical five.
   * Pass `null` to skip locations entirely.
   */
  locations?: string[] | null;
  /** Override the default "⌘K to navigate" tail. */
  tail?: React.ReactNode;
  className?: string;
}

const DEFAULT_LOCATIONS = [
  "London",
  "Milton Keynes",
  "Minneapolis",
  "Prague",
  "Dubai",
];

export function EditionFooter({
  rightSlot,
  locations = DEFAULT_LOCATIONS,
  tail = "⌘K to navigate",
  className,
}: EditionFooterProps) {
  return (
    <footer
      className={cn(
        "flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-6",
        className,
      )}
    >
      <p className="text-overline text-muted-foreground">
        <span className="text-foreground">bright.blue</span>
        {locations && locations.length > 0 && (
          <>
            <span className="mx-2 opacity-50">/</span>
            <span>{locations.join(" · ")}</span>
          </>
        )}
        {tail && (
          <>
            <span className="mx-2 opacity-50">/</span>
            <span>{tail}</span>
          </>
        )}
      </p>
      {rightSlot && (
        <div className="text-overline text-[var(--color-bb-cobalt)]">
          {rightSlot}
        </div>
      )}
    </footer>
  );
}
