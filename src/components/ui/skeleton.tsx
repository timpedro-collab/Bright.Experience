import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "skeleton bg-[hsl(233,48%,15%,0.6)] rounded-[var(--radius-chip)]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
