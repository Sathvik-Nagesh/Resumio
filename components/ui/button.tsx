import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_20px_40px_rgba(15,23,42,0.12)]",
        subtle:
          "bg-white/70 text-foreground backdrop-blur border border-white/40 hover:bg-white/90",
        outline:
          "border border-border/70 bg-transparent text-foreground hover:bg-white/40",
        ghost:
          "text-foreground hover:bg-foreground/5",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    // If we're rendering a native <button>, ensure a safe default `type` of "button"
    // to avoid accidental form submissions. If `type` is explicitly provided by
    // consumers, honor it. When `asChild` is true, do not force a default since
    // the child element may not be a button or may handle `type` differently.
    const buttonProps = asChild
      ? ({ ...props, ...(type !== undefined ? { type } : {}) } as React.ComponentProps<typeof Comp>)
      : ({ type: type ?? "button", ...props } as React.ComponentProps<typeof Comp>);

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref as any}
        {...buttonProps}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
