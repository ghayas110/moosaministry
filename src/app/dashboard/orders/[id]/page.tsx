"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { sanityClient } from "@/sanity/client";
import { orderByIdQuery } from "@/sanity/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPKR, relativeTime, cn } from "@/lib/utils";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Order = {
  _id: string;
  orderNumber: string;
  type: string;
  items: { name: string; quantity: number; unitPrice: number; variants?: { label: string }[]; notes?: string }[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: "received" | "preparing" | "ready" | "delivered" | "cancelled";
  kdsStatus: string;
  customerName?: string;
  customerPhone?: string;
  tableNumber?: string;
  deliveryAddress?: string;
  _createdAt: string;
  _updatedAt: string;
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const o = await sanityClient.fetch<Order | null>(orderByIdQuery, { id });
      if (!cancelled) {
        setOrder(o);
        setLoading(false);
      }
    }
    load();
    const sub = sanityClient
      .listen('*[_type=="order" && _id == $id]', { id }, { visibility: "query" })
      .subscribe(() => load());
    return () => {
      cancelled = true;
      sub.unsubscribe();
    };
  }, [id]);

  async function patch(body: object) {
    const res = await fetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) toast.success("Updated");
    else toast.error("Failed");
  }

  async function remove() {
    if (!confirm("Delete this order?")) return;
    const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Deleted");
      router.replace("/dashboard/orders");
    }
  }

  if (loading) return <div className="p-10 text-[var(--mm-cream)]/60">Loading…</div>;
  if (!order) return <div className="p-10 text-[var(--mm-cream)]/60">Order not found.</div>;

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-5xl">
      <Link
        href="/dashboard/orders"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--mm-tan)] hover:text-[var(--mm-cream)]"
      >
        <ArrowLeft className="h-3 w-3" /> Back to orders
      </Link>

      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <span className="text-xs uppercase tracking-[0.4em] text-[var(--mm-tan)]">{order.type}</span>
          <h1 className="font-display text-4xl mt-2 brand-gradient-text">{order.orderNumber}</h1>
          <div className="mt-2 text-xs text-[var(--mm-cream)]/50">
            Placed {relativeTime(order._createdAt)} · Updated {relativeTime(order._updatedAt)}
          </div>
        </div>
        <Button variant="ghost" onClick={remove}>
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      </header>

      <section className="grid lg:grid-cols-3 gap-5">
        <div className="glass rounded-2xl p-5">
          <div className="text-xs uppercase tracking-[0.3em] text-[var(--mm-tan)] mb-3">Order Status</div>
          <div className="space-y-1.5">
            {["received", "preparing", "ready", "delivered", "cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => patch({ orderStatus: s })}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition",
                  order.orderStatus === s
                    ? "bg-[var(--mm-maroon)] text-[var(--mm-cream)]"
                    : "hover:bg-[var(--mm-steam)]"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="text-xs uppercase tracking-[0.3em] text-[var(--mm-tan)] mb-3">KDS</div>
          <div className="space-y-1.5">
            {["pending", "in-progress", "completed", "bumped"].map((s) => (
              <button
                key={s}
                onClick={() => patch({ kdsStatus: s })}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition",
                  order.kdsStatus === s
                    ? "bg-[var(--mm-maroon)] text-[var(--mm-cream)]"
                    : "hover:bg-[var(--mm-steam)]"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="text-xs uppercase tracking-[0.3em] text-[var(--mm-tan)] mb-3">Payment</div>
          <div className="space-y-1.5">
            {["pending", "paid", "refunded", "void"].map((s) => (
              <button
                key={s}
                onClick={() => patch({ paymentStatus: s })}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition",
                  order.paymentStatus === s
                    ? "bg-[var(--mm-maroon)] text-[var(--mm-cream)]"
                    : "hover:bg-[var(--mm-steam)]"
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="border-t border-[var(--mm-line)] pt-3 mt-3 text-xs uppercase tracking-[0.3em] text-[var(--mm-tan)]">Method</div>
          <select
            value={order.paymentMethod}
            onChange={(e) => patch({ paymentMethod: e.target.value })}
            className="mt-2 w-full bg-[var(--mm-ink)] border border-[var(--mm-line)] rounded-md h-10 px-3 text-sm"
          >
            {["cash", "card", "cod", "split", "unpaid"].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="glass rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl">Customer</h3>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <Detail label="Name" value={order.customerName ?? "—"} />
          <Detail label="Phone" value={order.customerPhone ?? "—"} />
          <Detail label="Table" value={order.tableNumber ?? "—"} />
          {order.deliveryAddress && (
            <Detail label="Address" value={order.deliveryAddress} className="sm:col-span-3" />
          )}
        </div>
      </section>

      <section className="glass rounded-3xl p-6">
        <h3 className="font-display text-xl mb-4">Items</h3>
        <ul className="space-y-3">
          {order.items?.map((it, i) => (
            <li key={i} className="flex items-start justify-between text-sm border-b border-[var(--mm-line)] pb-3 last:border-0">
              <div>
                <div>
                  <strong>{it.quantity}×</strong> {it.name}
                </div>
                {it.variants && it.variants.length > 0 && (
                  <div className="text-xs text-[var(--mm-cream)]/50">
                    {it.variants.map((v) => v.label).join(" · ")}
                  </div>
                )}
                {it.notes && (
                  <div className="text-xs text-[var(--mm-tan)] italic">“{it.notes}”</div>
                )}
              </div>
              <div>{formatPKR((it.unitPrice ?? 0) * it.quantity)}</div>
            </li>
          ))}
        </ul>

        <div className="border-t border-[var(--mm-line)] mt-5 pt-5 space-y-1 text-sm">
          <Row label="Subtotal" value={formatPKR(order.subtotal ?? 0)} />
          {order.tax ? <Row label="Tax" value={formatPKR(order.tax)} /> : null}
          {order.discount ? <Row label="Discount" value={`- ${formatPKR(order.discount)}`} /> : null}
          <div className="border-t border-[var(--mm-line)] pt-2 flex justify-between font-semibold">
            <span>Total</span>
            <span className="gold-text">{formatPKR(order.total ?? 0)}</span>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Badge tone="cream">{order.type}</Badge>
        <Badge tone={order.orderStatus === "cancelled" ? "danger" : "neon"}>{order.orderStatus}</Badge>
      </div>
    </div>
  );
}

function Detail({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <div className="text-xs uppercase tracking-[0.3em] text-[var(--mm-tan)]">{label}</div>
      <div className="mt-1">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[var(--mm-cream)]/70">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
