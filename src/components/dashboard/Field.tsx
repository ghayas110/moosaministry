import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export function Field({
  label, hint, children, className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="text-xs uppercase tracking-[0.3em] text-[var(--mm-tan)]">{label}</span>
      <div className="mt-2">{children}</div>
      {hint && <p className="text-xs text-[var(--mm-cream)]/40 mt-1">{hint}</p>}
    </label>
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return (
    <textarea
      {...rest}
      className={cn(
        "w-full rounded-md border border-[var(--mm-line)] bg-[var(--mm-ink)]/60 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--mm-maroon)]/60",
        className
      )}
    />
  );
}

export function Select({
  className, ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...rest}
      className={cn(
        "w-full h-11 rounded-md border border-[var(--mm-line)] bg-[var(--mm-ink)]/60 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--mm-maroon)]/60",
        className
      )}
    />
  );
}

export function Toggle({
  checked, onChange, label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-center gap-3 px-4 py-2 rounded-full border text-sm transition",
        checked
          ? "bg-[var(--mm-maroon)] border-[var(--mm-maroon)] text-[var(--mm-cream)]"
          : "border-[var(--mm-line)] hover:bg-[var(--mm-steam)]"
      )}
    >
      <span className={cn("h-2.5 w-2.5 rounded-full", checked ? "bg-[var(--mm-cream)]" : "bg-[var(--mm-cream)]/30")} />
      {label}
    </button>
  );
}

export { Input };
