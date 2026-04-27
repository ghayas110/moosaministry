"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { sanityClient } from "@/sanity/client";
import { ordersQuery } from "@/sanity/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPKR, relativeTime, cn } from "@/lib/utils";
import { Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Order = {
  _id: string;
  orderNumber: string;
  type: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: "received" | "preparing" | "ready" | "delivered" | "cancelled";
  kdsStatus: string;
  customerName?: string;
  customerPhone?: string;
  tableNumber?: string;
  _createdAt: string;
};

const STATUSES = ["all", "received", "preparing", "ready", "delivered", "cancelled"] as const;

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<(typeof STATUSES)[number]>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const r = await sanityClient.fetch<Order[]>(ordersQuery);
      setOrders(r);
    }
    load();
    const sub = sanityClient
      .listen('*[_type=="order"]', {}, { visibility: "query" })
      .subscribe(() => load());
    return () => sub.unsubscribe();
  }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const inStatus = filter === "all" || o.orderStatus === filter;
      const q = search.trim().toLowerCase();
      const inSearch =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.customerPhone?.includes(q);
      return inStatus && inSearch;
    });
  }, [orders, filter, search]);

  async function patch(id: string, body: object) {
    const res = await fetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) toast.error("Update failed");
  }

  async function remove(id: string) {
    if (!confirm("Delete this order?")) return;
    const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
    if (res.ok) toast.success("Deleted");
    else toast.error("Failed");
  }

  return (
    <div className="p-6 md:p-10 space-y-6">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <span className="text-xs uppercase tracking-[0.4em] text-[var(--mm-tan)]">Orders</span>
          <h1 className="font-display text-4xl mt-2 brand-gradient-text">Order Management</h1>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--mm-cream)]/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, customer, phone…"
            className="pl-10"
          />
        </div>
      </header>

      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "px-4 py-2 rounded-full text-xs uppercase tracking-wider transition",
              filter === s
                ? "bg-[var(--mm-maroon)] text-[var(--mm-cream)]"
                : "border border-[var(--mm-line)] hover:bg-[var(--mm-steam)]"
            )}
          >
            {s} {s !== "all" && `(${orders.filter((o) => o.orderStatus === s).length})`}
          </button>
        ))}
      </div>

      <div className="glass rounded-3xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.2em] text-[var(--mm-cream)]/50 bg-[var(--mm-ink)]/60">
              <th className="text-left p-4">Order</th>
              <th className="text-left">Type</th>
              <th className="text-left">Customer</th>
              <th className="text-left">Total</th>
              <th className="text-left">Payment</th>
              <th className="text-left">Status</th>
              <th className="text-left">When</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o._id} className="border-t border-[var(--mm-line)]">
                <td className="p-4">
                  <Link href={`/dashboard/orders/${o._id}`} className="font-mono text-[var(--mm-tan)] hover:text-[var(--mm-cream)]">
                    {o.orderNumber}
                  </Link>
                </td>
                <td>
                  <Badge tone="cream">{o.type}</Badge>
                  {o.tableNumber && <span className="ml-2 text-xs text-[var(--mm-cream)]/50">T{o.tableNumber}</span>}
                </td>
                <td className="text-[var(--mm-cream)]/70">
                  {o.customerName ?? "—"}
                  {o.customerPhone && <div className="text-xs text-[var(--mm-cream)]/40">{o.customerPhone}</div>}
                </td>
                <td className="gold-text">{formatPKR(o.total ?? 0)}</td>
                <td>
                  <div className="text-xs">
                    <Badge tone={o.paymentStatus === "paid" ? "ok" : "warn"}>{o.paymentStatus}</Badge>
                    <div className="text-[var(--mm-cream)]/50 mt-1">{o.paymentMethod}</div>
                  </div>
                </td>
                <td>
                  <select
                    value={o.orderStatus}
                    onChange={(e) => patch(o._id, { orderStatus: e.target.value })}
                    className="bg-[var(--mm-ink)] border border-[var(--mm-line)] rounded px-2 py-1 text-xs"
                  >
                    {["received", "preparing", "ready", "delivered", "cancelled"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="text-xs text-[var(--mm-cream)]/50">{relativeTime(o._createdAt)}</td>
                <td className="text-right p-4">
                  <div className="flex gap-1 justify-end">
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/dashboard/orders/${o._id}`}>View</Link>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(o._id)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-300" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-10 text-[var(--mm-cream)]/50">
                  No orders match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
