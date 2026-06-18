/** Empty state — illustrative card with optional primary action */
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Surface treatment: "glass" for marketing/catalog pages, "flat" for editorial shells */
  tone?: "glass" | "flat";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = "md",
  tone = "glass",
}: EmptyStateProps) {
  const sizeStyles = {
    sm: "py-10 px-6",
    md: "py-16 px-8",
    lg: "py-24 px-10",
  } as const;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-card)]",
        "flex flex-col items-center justify-center text-center",
        tone === "glass"
          ? "border border-border/60 bg-card/45 backdrop-blur-md"
          : "border border-border/30 bg-transparent",
        sizeStyles[size],
        className
      )}
    >
      {tone === "glass" && (
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-primary/8 blur-3xl"
        />
      )}

      <div className={cn(
        "relative mb-5 flex h-16 w-16 items-center justify-center rounded-[var(--radius-card)]",
        tone === "glass"
          ? "border border-border/60 bg-muted/40"
          : "border border-border/40 bg-muted/20"
      )}>
        <Icon size={26} className="text-muted-foreground" />
      </div>

      <h3 className="text-heading text-lg font-bold text-foreground mb-1.5">
        {title}
      </h3>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>

      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {action &&
            (action.href ? (
              <Button asChild variant="brand">
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ) : (
              <Button variant="brand" onClick={action.onClick}>
                {action.label}
              </Button>
            ))}
          {secondaryAction && (
            <Button asChild variant="glass">
              <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
