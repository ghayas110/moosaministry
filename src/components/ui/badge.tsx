import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badge = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
  {
    variants: {
      tone: {
        cream: "border-[var(--mm-cream)]/30 text-[var(--mm-cream)]/80 bg-transparent",
        maroon: "border-[var(--mm-maroon)] text-[var(--mm-cream)] bg-[var(--mm-maroon)]/40",
        neon: "border-[var(--mm-neon)]/50 text-[var(--mm-neon)] bg-[var(--mm-neon)]/10",
        gold: "border-[var(--mm-gold)]/50 text-[var(--mm-gold)] bg-[var(--mm-gold)]/10",
        ok: "border-emerald-500/50 text-emerald-300 bg-emerald-500/10",
        warn: "border-amber-500/50 text-amber-300 bg-amber-500/10",
        danger: "border-red-500/50 text-red-300 bg-red-500/10",
      },
    },
    defaultVariants: { tone: "cream" },
  }
);

type Props = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badge>;

export function Badge({ className, tone, ...props }: Props) {
  return <span className={cn(badge({ tone }), className)} {...props} />;
}
