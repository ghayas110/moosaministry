"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { useStaffAuth } from "@/store/staffAuth";
import { Delete } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const setStaff = useStaffAuth((s) => s.setStaff);

  function press(d: string) {
    if (pin.length >= 6) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) submit(next);
  }
  function back() {
    setPin((p) => p.slice(0, -1));
  }

  async function submit(value = pin) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: value }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Invalid PIN");
      }
      const data = await res.json();
      setStaff(data.staff);
      toast.success(`Welcome, ${data.staff.name}`);
      router.replace("/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Login failed");
      setPin("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-10 w-full max-w-md text-center"
      >
        <div className="mx-auto mb-6">
          <Logo size={92} />
        </div>
        <div className="text-xs uppercase tracking-[0.4em] text-[var(--mm-tan)] mb-2">
          Staff Access
        </div>
        <h1 className="font-display text-3xl mb-6 brand-gradient-text">Enter your PIN</h1>

        <div className="flex justify-center gap-3 mb-8 h-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className={`h-3 w-3 rounded-full transition ${
                i < pin.length ? "bg-[var(--mm-cream)]" : "bg-[var(--mm-line)]"
              }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {["1","2","3","4","5","6","7","8","9"].map((d) => (
            <button
              key={d}
              onClick={() => press(d)}
              className="aspect-square rounded-2xl text-2xl font-display border border-[var(--mm-line)] hover:bg-[var(--mm-steam)] transition active:scale-95"
            >
              {d}
            </button>
          ))}
          <button
            onClick={back}
            className="aspect-square rounded-2xl border border-[var(--mm-line)] grid place-items-center hover:bg-[var(--mm-steam)] active:scale-95"
            aria-label="Backspace"
          >
            <Delete className="h-5 w-5" />
          </button>
          <button
            onClick={() => press("0")}
            className="aspect-square rounded-2xl text-2xl font-display border border-[var(--mm-line)] hover:bg-[var(--mm-steam)] active:scale-95"
          >
            0
          </button>
          <Button
            onClick={() => submit()}
            disabled={pin.length < 4 || busy}
            variant="neon"
            className="rounded-2xl aspect-square h-auto"
          >
            {busy ? "…" : "Enter"}
          </Button>
        </div>
        <p className="mt-6 text-xs text-[var(--mm-cream)]/40">
          Tip: seed staff PINs in /studio. Try <span className="font-mono">1234</span> after seeding.
        </p>
      </motion.div>
    </div>
  );
}
