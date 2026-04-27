import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-11 w-full rounded-md border border-[var(--mm-line)] bg-[var(--mm-ink)]/60 px-4 py-2 text-sm text-[var(--mm-cream)] placeholder:text-[var(--mm-cream)]/40 transition focus:outline-none focus:ring-2 focus:ring-[var(--mm-maroon)]/60 disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
