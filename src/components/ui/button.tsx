"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mm-neon)]/60 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--mm-maroon)] text-[var(--mm-cream)] hover:bg-[var(--mm-maroon-deep)] shadow-[0_8px_30px_-12px_rgba(92,26,46,0.8)]",
        neon:
          "bg-[var(--mm-neon)] text-white hover:brightness-110 shadow-[0_8px_30px_-10px_rgba(255,45,85,0.8)]",
        ghost:
          "bg-transparent text-[var(--mm-cream)] hover:bg-[var(--mm-steam)] border border-[var(--mm-line)]",
        outline:
          "bg-transparent border border-[var(--mm-cream)]/30 text-[var(--mm-cream)] hover:bg-[var(--mm-cream)]/5",
        gold:
          "bg-[var(--mm-gold)] text-[var(--mm-ink)] hover:brightness-105",
        cream:
          "bg-[var(--mm-cream)] text-[var(--mm-ink)] hover:bg-[var(--mm-tan)]",
        danger: "bg-red-600 text-white hover:bg-red-700",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-6",
        lg: "h-14 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
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
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
