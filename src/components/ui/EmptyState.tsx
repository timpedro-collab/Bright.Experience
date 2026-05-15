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
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = "md",
}: EmptyStateProps) {
  const sizeStyles = {
    sm: "py-10 px-6",
    md: "py-16 px-8",
    lg: "py-24 px-10",
  } as const;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-card)] border border-white/[0.06]",
        "bg-[hsl(233,56%,11%,0.45)] backdrop-blur-md",
        "flex flex-col items-center justify-center text-center",
        sizeStyles[size],
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-primary/8 blur-3xl"
      />

      <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-[var(--radius-card)] border border-white/8 bg-white/[0.03] shadow-[inset_0_1px_0_0_hsl(0,0%,100%,0.04)]">
        <Icon size={26} className="text-muted-foreground" />
      </div>

      <h3 className="text-heading text-lg font-semibold text-foreground mb-1.5">
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
