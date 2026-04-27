"use client";

import { useEffect, useState } from "react";
import { sanityClient } from "@/sanity/client";
import { groq } from "next-sanity";
import { Badge } from "@/components/ui/badge";
import { relativeTime } from "@/lib/utils";

type Log = {
  _id: string;
  type: "consumption" | "restock" | "waste" | "adjustment";
  quantityChange: number;
  reason?: string;
  performedBy?: string;
  timestamp: string;
  ingredient?: { name: string; unit: string };
};

const logsQuery = groq`
  *[_type=="inventoryLog"] | order(timestamp desc)[0...200]{
    _id, type, quantityChange, reason, performedBy, timestamp,
    "ingredient": ingredient->{name, unit}
  }
`;

export default function ReportsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [filter, setFilter] = useState<"all" | Log["type"]>("all");

  useEffect(() => {
    async function load() {
      const r = await sanityClient.fetch<Log[]>(logsQuery);
      setLogs(r);
    }
    load();
    const sub = sanityClient
      .listen('*[_type=="inventoryLog"]', {}, { visibility: "query" })
      .subscribe(() => load());
    return () => sub.unsubscribe();
  }, []);

  const filtered = filter === "all" ? logs : logs.filter((l) => l.type === filter);

  const totals = logs.reduce(
    (acc, l) => {
      acc[l.type] = (acc[l.type] ?? 0) + Math.abs(l.quantityChange);
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="p-6 md:p-10 space-y-6">
      <header>
        <span className="text-xs uppercase tracking-[0.4em] text-[var(--mm-tan)]">Inventory</span>
        <h1 className="font-display text-4xl mt-2 brand-gradient-text">Reports & Logs</h1>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(["consumption", "restock", "waste", "adjustment"] as const).map((t) => (
          <div key={t} className="glass rounded-2xl p-5">
            <div className="text-xs uppercase tracking-[0.3em] text-[var(--mm-tan)]">{t}</div>
            <div className="font-display text-3xl mt-2">
              {(totals[t] ?? 0).toFixed(1)}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {(["all", "consumption", "restock", "waste", "adjustment"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-wider ${
              filter === t
                ? "bg-[var(--mm-maroon)] text-[var(--mm-cream)]"
                : "border border-[var(--mm-line)] hover:bg-[var(--mm-steam)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="glass rounded-3xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.2em] text-[var(--mm-cream)]/50 bg-[var(--mm-ink)]/60">
              <th className="text-left p-4">When</th>
              <th className="text-left">Type</th>
              <th className="text-left">Item</th>
              <th className="text-left">Change</th>
              <th className="text-left">Reason</th>
              <th className="text-left">By</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l._id} className="border-t border-[var(--mm-line)]">
                <td className="p-4 text-[var(--mm-cream)]/70 text-xs">{relativeTime(l.timestamp)}</td>
                <td>
                  <Badge tone={l.type === "consumption" ? "warn" : l.type === "restock" ? "ok" : "cream"}>
                    {l.type}
                  </Badge>
                </td>
                <td>{l.ingredient?.name ?? "—"}</td>
                <td className="font-mono">
                  {l.quantityChange > 0 ? "+" : ""}
                  {l.quantityChange} {l.ingredient?.unit ?? ""}
                </td>
                <td className="text-[var(--mm-cream)]/60">{l.reason ?? "—"}</td>
                <td className="text-[var(--mm-cream)]/60">{l.performedBy ?? "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-[var(--mm-cream)]/50">
                  No logs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
