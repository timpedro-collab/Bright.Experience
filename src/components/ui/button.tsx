import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium",
    "ring-offset-background transition-all duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.97]",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    "rounded-[var(--radius-control)]"
  ),
  {
    variants: {
      variant: {
        // Brand-aligned primary — the Ink cobalt→cyan gradient + premium
        // shadow. Token-based so `.theme-light` darkens the cyan endpoint.
        default: cn(
          "text-primary-foreground",
          "bg-[linear-gradient(120deg,var(--color-bb-cobalt),var(--color-brand-cyan))]",
          "shadow-[var(--bb-shadow-premium)]",
          "hover:shadow-[var(--bb-shadow-float)] hover:brightness-110"
        ),
        brand: cn(
          "text-primary-foreground",
          "bg-[linear-gradient(120deg,var(--color-bb-cobalt),var(--color-brand-cyan))]",
          "shadow-[var(--bb-shadow-premium)]",
          "hover:shadow-[var(--bb-shadow-float)] hover:brightness-110"
        ),
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground hover:border-foreground/25",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "text-foreground hover:bg-accent hover:text-accent-foreground",
        // Glass = ghost variant with subtle border, used for secondary CTAs
        // alongside `brand` / `default` (e.g. "Request proposal" next to "Book now")
        glass: cn(
          "bg-transparent text-foreground",
          "border border-border",
          "hover:bg-accent hover:border-foreground/25"
        ),
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        xs: "h-7 rounded-md px-2.5 text-xs [&_svg]:size-3.5",
        sm: "h-9 px-3.5 text-sm",
        lg: "h-12 px-7 text-base [&_svg]:size-[18px]",
        xl: "h-14 px-8 text-base [&_svg]:size-5",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8 [&_svg]:size-4",
      },
      // Cloud CTAs use a fully-rounded pill; defaults keep the control radius.
      shape: {
        default: "",
        pill: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
