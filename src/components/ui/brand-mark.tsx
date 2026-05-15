/** Bright.Blue brand mark — gradient `B` glyph used in headers & login */
import * as React from "react";
import { cn } from "@/lib/utils";

interface BrandMarkProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  xs: "h-6 w-6 text-[10px] rounded-md",
  sm: "h-8 w-8 text-sm rounded-lg",
  md: "h-9 w-9 text-base rounded-lg",
  lg: "h-12 w-12 text-xl rounded-xl",
  xl: "h-16 w-16 text-3xl rounded-[var(--radius-card)]",
} as const;

export const BrandMark = React.forwardRef<HTMLDivElement, BrandMarkProps>(
  ({ className, size = "sm", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative shrink-0 inline-flex items-center justify-center",
          "bg-[linear-gradient(135deg,hsl(223,94%,53%),hsl(189,100%,75%))]",
          "text-white font-bold font-[var(--font-heading)]",
          "shadow-[0_6px_20px_-8px_hsl(223,94%,53%,0.65),inset_0_0_0_1px_hsl(0,0%,100%,0.18)]",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        B
      </div>
    );
  }
);
BrandMark.displayName = "BrandMark";

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
        <span className="text-heading text-sm font-semibold text-foreground">
          Bright.Experience
        </span>
        {tagline && (
          <span className="text-overline text-[0.6rem] text-muted-foreground">
            {tagline}
          </span>
        )}
      </div>
    </div>
  );
}
