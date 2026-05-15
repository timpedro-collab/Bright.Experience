import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  cn(
    "rounded-[var(--radius-card)] border text-card-foreground",
    "transition-all duration-200"
  ),
  {
    variants: {
      tone: {
        default: "bg-card border-border shadow-[var(--bb-shadow-card)]",
        glass: cn(
          "backdrop-blur-xl border-white/10",
          "bg-[hsl(233,56%,11%,0.72)]",
          "shadow-[var(--bb-shadow-card)]"
        ),
        subtle: cn(
          "border-white/[0.06]",
          "bg-[hsl(233,50%,9%)]"
        ),
        elevated: cn(
          "backdrop-blur-xl border-white/10",
          "bg-[hsl(233,56%,11%,0.85)]",
          "shadow-[var(--bb-shadow-premium)]"
        ),
        outline: "bg-transparent border-white/10",
      },
      interactive: {
        true: cn(
          "cursor-pointer",
          "hover:border-white/24 hover:shadow-[var(--bb-shadow-premium)] hover:-translate-y-0.5",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        ),
        false: "",
      },
    },
    defaultVariants: {
      tone: "glass",
      interactive: false,
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, tone, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ tone, interactive, className }))}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-heading text-lg font-semibold leading-tight tracking-tight text-foreground",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
};
