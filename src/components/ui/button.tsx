"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/25 hover:brightness-110",
        secondary:
          "bg-[var(--surface-2)] text-[var(--fg)] hover:bg-[var(--surface-3)] border border-[var(--border)]",
        ghost: "hover:bg-[var(--surface-2)] text-[var(--fg-muted)] hover:text-[var(--fg)]",
        outline:
          "border border-[var(--border)] bg-transparent hover:bg-[var(--surface-2)] text-[var(--fg)]",
        destructive: "bg-rose-500 text-white hover:bg-rose-600",
        glass:
          "bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20 text-[var(--fg)] hover:bg-white/20",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-2xl px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";
