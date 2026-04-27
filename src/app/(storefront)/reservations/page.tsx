"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ReservationsPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [party, setParty] = useState(2);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!name || !phone || !date || !time) {
      toast.error("Fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, date, time, party, notes }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Table requested — we'll confirm shortly.");
      setName(""); setPhone(""); setDate(""); setTime(""); setParty(2); setNotes("");
    } catch {
      toast.error("Could not submit reservation");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pt-32 pb-24 mx-auto max-w-2xl px-4 md:px-8">
      <header className="text-center mb-10">
        <span className="text-xs uppercase tracking-[0.4em] text-[var(--mm-tan)]">
          Reservations
        </span>
        <h1 className="font-display text-5xl md:text-6xl mt-4 brand-gradient-text">
          Save your seat.
        </h1>
        <p className="mt-3 text-[var(--mm-cream)]/60">
          Walk-ins always welcome — but a booked table never waits.
        </p>
      </header>

      <div className="glass rounded-3xl p-8 space-y-4">
        <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-[var(--mm-tan)]">
            Party size
          </label>
          <Input
            type="number"
            min={1}
            max={20}
            value={party}
            onChange={(e) => setParty(Number(e.target.value) || 2)}
            className="mt-2"
          />
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Special requests…"
          rows={3}
          className="w-full rounded-xl border border-[var(--mm-line)] bg-[var(--mm-ink)]/60 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--mm-maroon)]/60"
        />
        <Button onClick={submit} variant="neon" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Sending…" : "Request Reservation"}
        </Button>
      </div>
    </div>
  );
}
