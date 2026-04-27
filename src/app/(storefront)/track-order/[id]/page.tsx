"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { sanityClient } from "@/sanity/client";
import { orderByIdQuery } from "@/sanity/queries";
import { Badge } from "@/components/ui/badge";
import { formatPKR, cn, relativeTime } from "@/lib/utils";
import { Check, ChefHat, Bike, PackageCheck, Receipt } from "lucide-react";

type OrderStatus = "received" | "preparing" | "ready" | "delivered" | "cancelled";

const STEPS: { key: OrderStatus; label: string; icon: React.ReactNode }[] = [
  { key: "received", label: "Received", icon: <Receipt className="h-5 w-5" /> },
  { key: "preparing", label: "Preparing", icon: <ChefHat className="h-5 w-5" /> },
  { key: "ready", label: "Ready", icon: <PackageCheck className="h-5 w-5" /> },
  { key: "delivered", label: "Delivered", icon: <Bike className="h-5 w-5" /> },
];

type Order = {
  _id: string;
  orderNumber: string;
  type: string;
  items: { name: string; quantity: number; unitPrice: number; variants?: { label: string }[]; notes?: string }[];
  total: number;
  subtotal: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: OrderStatus;
  customerName?: string;
  tableNumber?: string;
  _createdAt: string;
};

export default function TrackOrderPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let sub: { unsubscribe: () => void } | null = null;
    let cancelled = false;

    async function load() {
      const o = await sanityClient.fetch<Order | null>(orderByIdQuery, { id });
      if (!cancelled) {
        setOrder(o);
        setLoading(false);
      }
      sub = sanityClient
        .listen(orderByIdQuery, { id }, { includeResult: true, visibility: "query" })
        .subscribe((evt) => {
          if (evt.type === "mutation" || evt.type === "welcome") {
            sanityClient
              .fetch<Order | null>(orderByIdQuery, { id })
              .then((next) => {
                if (!cancelled) setOrder(next);
              });
          }
        });
    }
    load();
    return () => {
      cancelled = true;
      sub?.unsubscribe();
    };
  }, [id]);

  if (loading) {
    return <div className="pt-32 pb-24 mx-auto max-w-3xl px-4 text-center">Loading…</div>;
  }
  if (!order) {
    return (
      <div className="pt-32 pb-24 mx-auto max-w-3xl px-4 text-center">
        <h1 className="font-display text-3xl mb-2">Order not found</h1>
        <p className="text-[var(--mm-cream)]/60">Check the link or order number.</p>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === order.orderStatus);

  return (
    <div className="pt-32 pb-24 mx-auto max-w-3xl px-4 md:px-8">
      <header className="text-center mb-10">
        <span className="text-xs uppercase tracking-[0.4em] text-[var(--mm-tan)]">
          Tracking
        </span>
        <h1 className="font-display text-4xl md:text-5xl mt-3 brand-gradient-text">
          {order.orderNumber}
        </h1>
        <p className="mt-2 text-[var(--mm-cream)]/60 text-sm">
          Placed {relativeTime(order._createdAt)}
        </p>
      </header>

      <div className="glass rounded-3xl p-8 mb-6">
        <div className="grid grid-cols-4 gap-3">
          {STEPS.map((s, i) => {
            const active = i <= currentIndex;
            const current = i === currentIndex;
            return (
              <div key={s.key} className="text-center">
                <div
                  className={cn(
                    "mx-auto h-12 w-12 rounded-full grid place-items-center transition",
                    active
                      ? "bg-[var(--mm-maroon)] text-[var(--mm-cream)]"
                      : "bg-[var(--mm-steam)] text-[var(--mm-cream)]/40",
                    current && "pulse-neon"
                  )}
                >
                  {active && i < currentIndex ? <Check className="h-5 w-5" /> : s.icon}
                </div>
                <div
                  className={cn(
                    "mt-3 text-xs uppercase tracking-wider",
                    active ? "text-[var(--mm-cream)]" : "text-[var(--mm-cream)]/40"
                  )}
                >
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 text-center">
          <Badge tone={order.orderStatus === "cancelled" ? "danger" : "neon"}>
            {order.orderStatus}
          </Badge>
        </div>
      </div>

      <div className="glass rounded-3xl p-6">
        <h3 className="font-display text-xl mb-4">Items</h3>
        <ul className="space-y-3">
          {order.items.map((it, idx) => (
            <li key={idx} className="flex justify-between text-sm">
              <div>
                <div>
                  {it.name}{" "}
                  <span className="text-[var(--mm-cream)]/40">× {it.quantity}</span>
                </div>
                {it.variants && it.variants.length > 0 && (
                  <div className="text-xs text-[var(--mm-cream)]/40">
                    {it.variants.map((v) => v.label).join(" · ")}
                  </div>
                )}
              </div>
              <div>{formatPKR(it.unitPrice * it.quantity)}</div>
            </li>
          ))}
        </ul>
        <div className="border-t border-[var(--mm-line)] mt-5 pt-5 flex justify-between font-semibold">
          <span>Total</span>
          <span className="gold-text">{formatPKR(order.total)}</span>
        </div>
      </div>
    </div>
  );
}
