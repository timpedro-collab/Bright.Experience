/** bright.blue brand mark — the official circular `<b` symbol, used in headers & login */
import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandMarkProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

const sizePx = {
  xs: 24,
  sm: 32,
  md: 36,
  lg: 48,
  xl: 64,
} as const;

const sizeClasses = {
  xs: "h-6 w-6",
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
} as const;

export const BrandMark = React.forwardRef<HTMLDivElement, BrandMarkProps>(
  ({ className, size = "sm", ...props }, ref) => {
    const px = sizePx[size];
    return (
      <div
        ref={ref}
        className={cn(
          "relative shrink-0 inline-flex items-center justify-center",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {/* The symbol is a self-contained blue disc, so it reads cleanly on
            both light and dark chrome without a separate variant. */}
        <Image
          src="/brand/bright-blue-symbol.png"
          alt="bright.blue"
          width={px}
          height={px}
          priority
          className="h-full w-full object-contain"
        />
      </div>
    );
  }
);
BrandMark.displayName = "BrandMark";

const wordmarkHeights = {
  sm: 18,
  md: 22,
} as const;

/**
 * bright.blue wordmark — CSS-only theme swap (design-language §6).
 * Light-ink PNG on Ink / `.theme-dark`; dark-ink PNG on Ink Light.
 */
function BrightBlueWordmark({ size = "sm" }: { size?: "sm" | "md" }) {
  const h = wordmarkHeights[size];
  return (
    <span className="relative inline-flex shrink-0 items-center">
      {/* Light-on-dark — default Ink + force-Ink scopes */}
      <Image
        src="/brand/bright-blue-wordmark-light.png"
        alt="bright.blue"
        width={Math.round(h * 5.2)}
        height={h}
        className="h-[var(--bb-wordmark-h)] w-auto object-contain [.theme-light_&]:hidden [.theme-dark_&]:!block"
        style={{ "--bb-wordmark-h": `${h}px` } as React.CSSProperties}
        priority
      />
      {/* Dark-on-light — Ink Light only (hidden inside `.theme-dark`) */}
      <Image
        src="/brand/bright-blue-wordmark-dark.png"
        alt="bright.blue"
        width={Math.round(h * 5.2)}
        height={h}
        className="hidden h-[var(--bb-wordmark-h)] w-auto object-contain [.theme-light_&]:block [.theme-dark_&]:!hidden"
        style={{ "--bb-wordmark-h": `${h}px` } as React.CSSProperties}
        priority
      />
    </span>
  );
}

interface BrandLockupProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md";
  tagline?: string;
}

export function BrandLockup({
  size = "sm",
  tagline,
  className,
  ...props
}: BrandLockupProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)} {...props}>
      <BrandMark size={size} />
      <div className="flex flex-col leading-tight">
        <div className="flex items-baseline gap-1">
          <BrightBlueWordmark size={size} />
          <span className="text-heading text-sm font-semibold text-foreground">
            Experience
          </span>
        </div>
        {tagline && (
          <span className="text-overline text-[0.6rem] text-muted-foreground">
            {tagline}
          </span>
        )}
      </div>
    </div>
  );
}
