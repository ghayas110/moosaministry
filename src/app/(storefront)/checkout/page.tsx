"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPKR, cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

type OrderType = "delivery" | "takeaway" | "dine-in";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const [type, setType] = useState<OrderType>("delivery");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "cash">("cod");

  const total = subtotal();

  if (items.length === 0) {
    return (
      <div className="pt-32 pb-24 mx-auto max-w-2xl px-4 text-center">
        <h1 className="font-display text-4xl mb-4">Cart is empty</h1>
        <p className="text-[var(--mm-cream)]/60 mb-6">
          Find a dish you love first.
        </p>
        <Button asChild variant="neon">
          <Link href="/menu">Browse Menu</Link>
        </Button>
      </div>
    );
  }

  async function placeOrder() {
    if (!name.trim() || !phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    if (type === "delivery" && !address.trim()) {
      toast.error("Delivery address required");
      return;
    }
    if (type === "dine-in" && !tableNumber.trim()) {
      toast.error("Table number required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          items: items.map((it) => ({
            menuItemId: it.menuItemId,
            name: it.name,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            variants: it.variants,
            notes: it.notes,
          })),
          subtotal: total,
          tax: 0,
          discount: 0,
          total,
          customerName: name,
          customerPhone: phone,
          deliveryAddress: type === "delivery" ? address : undefined,
          tableNumber: type === "dine-in" ? tableNumber : undefined,
          notes,
          paymentMethod: type === "delivery" ? paymentMethod : "cash",
          source: "online",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to place order");
      }
      const data = await res.json();
      clear();
      toast.success("Order placed — heading to kitchen");
      router.push(`/track-order/${data.orderNumber}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Order failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pt-32 pb-24 mx-auto max-w-5xl px-4 md:px-8">
      <header className="mb-8">
        <span className="text-xs uppercase tracking-[0.4em] text-[var(--mm-tan)]">
          Checkout
        </span>
        <h1 className="font-display text-4xl md:text-5xl mt-3 brand-gradient-text">
          Almost yours.
        </h1>
      </header>

      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        <div className="space-y-6">
          {/* Order type */}
          <Section title="Order Type">
            <div className="grid grid-cols-3 gap-2">
              {(["delivery", "takeaway", "dine-in"] as OrderType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={cn(
                    "p-4 rounded-2xl border text-sm font-medium transition",
                    type === t
                      ? "bg-[var(--mm-maroon)] border-[var(--mm-maroon)] text-[var(--mm-cream)]"
                      : "border-[var(--mm-line)] hover:bg-[var(--mm-steam)]"
                  )}
                >
                  {t === "delivery" ? "🛵 Delivery" : t === "takeaway" ? "🥡 Takeaway" : "🪑 Dine-In"}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Contact">
            <div className="grid sm:grid-cols-2 gap-3">
              <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Phone (+92…)" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </Section>

          {type === "delivery" && (
            <Section title="Delivery Address">
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House #, street, area, landmark…"
                rows={3}
                className="w-full rounded-xl border border-[var(--mm-line)] bg-[var(--mm-ink)]/60 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--mm-maroon)]/60"
              />
            </Section>
          )}

          {type === "dine-in" && (
            <Section title="Table">
              <Input
                placeholder="Table number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
              />
            </Section>
          )}

          <Section title="Order Notes (optional)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Allergies, preferences…"
              rows={2}
              className="w-full rounded-xl border border-[var(--mm-line)] bg-[var(--mm-ink)]/60 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--mm-maroon)]/60"
            />
          </Section>

          {type === "delivery" && (
            <Section title="Payment">
              <div className="grid grid-cols-2 gap-2">
                <PaymentChip active={paymentMethod === "cod"} onClick={() => setPaymentMethod("cod")}>
                  💵 Cash on Delivery
                </PaymentChip>
                <PaymentChip active={paymentMethod === "cash"} onClick={() => setPaymentMethod("cash")}>
                  🏪 Pay at Pickup
                </PaymentChip>
              </div>
            </Section>
          )}
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-28 self-start">
          <div className="glass rounded-3xl p-6">
            <h3 className="font-display text-xl mb-4">Order Summary</h3>
            <ul className="space-y-3 max-h-72 overflow-y-auto scrollbar-thin pr-1">
              {items.map((it) => {
                const lineTotal =
                  (it.unitPrice + it.variants.reduce((m, v) => m + v.priceModifier, 0)) * it.quantity;
                return (
                  <li key={it.lineId} className="flex justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <div className="truncate">
                        {it.name} <span className="text-[var(--mm-cream)]/40">× {it.quantity}</span>
                      </div>
                      {it.variants.length > 0 && (
                        <div className="text-xs text-[var(--mm-cream)]/40 truncate">
                          {it.variants.map((v) => v.label).join(" · ")}
                        </div>
                      )}
                    </div>
                    <div className="whitespace-nowrap">{formatPKR(lineTotal)}</div>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-[var(--mm-line)] mt-5 pt-5 space-y-2">
              <Row label="Subtotal" value={formatPKR(total)} />
              <Row label="Delivery / Tax" value="—" muted />
              <div className="border-t border-[var(--mm-line)] pt-3 flex justify-between font-semibold">
                <span>Total</span>
                <span className="gold-text">{formatPKR(total)}</span>
              </div>
            </div>
            <Button
              size="lg"
              variant="neon"
              className="w-full mt-6"
              onClick={placeOrder}
              disabled={submitting}
            >
              {submitting ? "Sending to kitchen…" : "Place Order"}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass rounded-3xl p-6">
      <div className="text-xs uppercase tracking-[0.3em] text-[var(--mm-tan)] mb-4">
        {title}
      </div>
      {children}
    </section>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={cn("flex justify-between text-sm", muted && "text-[var(--mm-cream)]/40")}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function PaymentChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-3 rounded-xl border text-sm transition",
        active
          ? "bg-[var(--mm-maroon)] border-[var(--mm-maroon)] text-[var(--mm-cream)]"
          : "border-[var(--mm-line)] hover:bg-[var(--mm-steam)]"
      )}
    >
      {children}
    </button>
  );
}
