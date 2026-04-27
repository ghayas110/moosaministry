"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sanityClient } from "@/sanity/client";
import { activeKdsTicketsQuery } from "@/sanity/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, elapsedSeconds, fmtDuration } from "@/lib/utils";
import { Volume2, VolumeX, Settings2, Flame } from "lucide-react";
import { toast } from "sonner";

type KdsItem = {
  name: string;
  quantity: number;
  notes?: string;
  variants?: { label: string }[];
  preparedItems?: number;
};
type KdsTicket = {
  _id: string;
  orderNumber: string;
  type: string;
  tableNumber?: string;
  customerName?: string;
  items: KdsItem[];
  kdsStatus: "pending" | "in-progress" | "completed";
  orderStatus: string;
  priority?: boolean;
  _createdAt: string;
};

export default function KdsPage() {
  const [tickets, setTickets] = useState<KdsTicket[]>([]);
  const [now, setNow] = useState(Date.now());
  const [soundOn, setSoundOn] = useState(false);
  const [columns, setColumns] = useState(3);
  const [filter, setFilter] = useState<"all" | "dine-in" | "delivery" | "takeaway">("all");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let prevIds = new Set<string>();
    let cancelled = false;

    async function load() {
      const data = await sanityClient.fetch<KdsTicket[]>(activeKdsTicketsQuery);
      if (cancelled) return;
      const newIds = new Set(data.map((d) => d._id));
      if (prevIds.size > 0) {
        for (const id of newIds) {
          if (!prevIds.has(id) && soundOn) {
            try {
              new Audio("/chime.mp3").play().catch(() => {});
            } catch {}
            toast.success("New ticket");
          }
        }
      }
      prevIds = newIds;
      setTickets(data);
    }

    load();
    const sub = sanityClient
      .listen('*[_type=="order"]', {}, { visibility: "query" })
      .subscribe(() => load());
    return () => {
      cancelled = true;
      sub.unsubscribe();
    };
  }, [soundOn]);

  const filtered = useMemo(() => {
    if (filter === "all") return tickets;
    if (filter === "takeaway")
      return tickets.filter((t) => t.type === "takeaway" || t.type === "pos-takeaway");
    return tickets.filter((t) => t.type === filter);
  }, [tickets, filter]);

  async function patch(id: string, body: object) {
    await fetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  const queueCount = tickets.length;
  const avgPrep =
    tickets.length === 0
      ? 0
      : Math.floor(
          tickets.reduce((s, t) => s + elapsedSeconds(t._createdAt), 0) / tickets.length
        );

  return (
    <div className="min-h-screen bg-[#06060a] text-[var(--mm-cream)] flex flex-col">
      <header className="px-6 py-4 border-b border-[var(--mm-line)] flex items-center gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.4em] text-[var(--mm-tan)]">
            Kitchen Display
          </span>
          <h1 className="font-display text-2xl">Live Service</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {(["all", "dine-in", "takeaway", "delivery"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs uppercase tracking-wider",
                filter === f
                  ? "bg-[var(--mm-maroon)] text-[var(--mm-cream)]"
                  : "border border-[var(--mm-line)] hover:bg-[var(--mm-steam)]"
              )}
            >
              {f}
            </button>
          ))}
          <button
            onClick={() => setSoundOn((s) => !s)}
            className="h-9 w-9 grid place-items-center rounded-full border border-[var(--mm-line)] hover:bg-[var(--mm-steam)]"
            aria-label="Toggle sound"
          >
            {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setShowSettings((s) => !s)}
            className="h-9 w-9 grid place-items-center rounded-full border border-[var(--mm-line)] hover:bg-[var(--mm-steam)]"
            aria-label="Settings"
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      {showSettings && (
        <div className="px-6 py-3 bg-[var(--mm-ink)] border-b border-[var(--mm-line)] flex gap-6 items-center text-sm">
          <label className="flex items-center gap-2">
            Columns
            <select
              value={columns}
              onChange={(e) => setColumns(Number(e.target.value))}
              className="bg-[var(--mm-ink)] border border-[var(--mm-line)] rounded px-2 py-1"
            >
              {[2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      <main
        className="flex-1 overflow-y-auto p-5 grid gap-4 auto-rows-min"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((t) => (
            <Ticket key={t._id} ticket={t} now={now} onPatch={patch} />
          ))}
          {filtered.length === 0 && (
            <div
              className="col-span-full text-center py-20 text-[var(--mm-cream)]/40"
              style={{ gridColumn: `1 / -1` }}
            >
              All clear. The kitchen breathes.
            </div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-[var(--mm-line)] px-6 py-3 flex items-center gap-6 text-xs text-[var(--mm-cream)]/70">
        <span>Queue: <strong className="text-[var(--mm-cream)]">{queueCount}</strong></span>
        <span>Avg time on board: <strong className="text-[var(--mm-cream)]">{fmtDuration(avgPrep)}</strong></span>
        <span className="ml-auto opacity-60">Realtime via Sanity listener</span>
      </footer>
    </div>
  );
}

function Ticket({
  ticket,
  now,
  onPatch,
}: {
  ticket: KdsTicket;
  now: number;
  onPatch: (id: string, body: object) => Promise<void>;
}) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const elapsed = Math.max(0, Math.floor((now - new Date(ticket._createdAt).getTime()) / 1000));
  const tone =
    elapsed > 1200 ? "danger" : elapsed > 600 ? "warn" : "ok";
  const allChecked =
    ticket.items.length > 0 &&
    ticket.items.every((_, i) => checked[i] === true);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, x: 100 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      className={cn(
        "rounded-2xl border p-4 flex flex-col gap-3 bg-[var(--mm-ink)]",
        ticket.priority
          ? "border-[var(--mm-neon)]/70 maroon-glow"
          : "border-[var(--mm-line)]"
      )}
    >
      <header className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--mm-tan)]">
            {ticket.type}
            {ticket.tableNumber && ` · Table ${ticket.tableNumber}`}
          </div>
          <h3 className="font-display text-2xl tracking-wide">{ticket.orderNumber}</h3>
        </div>
        <Badge tone={tone}>{fmtDuration(elapsed)}</Badge>
      </header>

      {ticket.priority && (
        <Badge tone="neon" className="self-start">
          <Flame className="h-3 w-3" /> URGENT
        </Badge>
      )}

      <ul className="space-y-2">
        {ticket.items.map((it, idx) => (
          <li
            key={idx}
            className={cn(
              "flex items-start gap-3 p-2 rounded-lg",
              checked[idx] ? "bg-emerald-500/10" : "bg-[var(--mm-steam)]"
            )}
          >
            <button
              onClick={() => setChecked((c) => ({ ...c, [idx]: !c[idx] }))}
              className={cn(
                "h-6 w-6 mt-0.5 shrink-0 rounded border-2 grid place-items-center transition",
                checked[idx]
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : "border-[var(--mm-cream)]/30"
              )}
            >
              {checked[idx] ? "✓" : ""}
            </button>
            <div className="flex-1">
              <div className={cn("text-base", checked[idx] && "line-through opacity-50")}>
                <span className="font-bold gold-text">{it.quantity}×</span>{" "}
                <span className="font-display">{it.name}</span>
              </div>
              {it.variants && it.variants.length > 0 && (
                <div className="text-xs text-[var(--mm-tan)] mt-0.5">
                  {it.variants.map((v) => v.label).join(" · ")}
                </div>
              )}
              {it.notes && (
                <div className="text-xs text-[var(--mm-neon)] italic mt-0.5">
                  ⚠ {it.notes}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex gap-2 pt-2">
        {ticket.kdsStatus === "pending" && (
          <Button
            size="sm"
            variant="primary"
            className="flex-1"
            onClick={() => onPatch(ticket._id, { kdsStatus: "in-progress" })}
          >
            Start
          </Button>
        )}
        <Button
          size="sm"
          variant={allChecked ? "neon" : "outline"}
          className="flex-1"
          onClick={() =>
            onPatch(ticket._id, {
              kdsStatus: "completed",
              orderStatus: "ready",
            })
          }
        >
          BUMP
        </Button>
      </div>
    </motion.article>
  );
}
