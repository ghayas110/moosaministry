"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { urlFor } from "@/sanity/client";
import { usePos } from "@/store/posOrder";
import { useStaffAuth } from "@/store/staffAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn, formatPKR } from "@/lib/utils";
import { toast } from "sonner";
import { Minus, Plus, Search, Trash2, X, Send, Printer } from "lucide-react";
import type { MenuCategory, MenuItem } from "@/components/storefront/MenuExplorer";
import { motion, AnimatePresence } from "framer-motion";

type Table = {
  _id: string;
  tableNumber: string;
  section?: string;
  capacity?: number;
  isOccupied?: boolean;
};

export function POSTerminal({
  categories,
  items,
  tables,
}: {
  categories: MenuCategory[];
  items: MenuItem[];
  tables: Table[];
}) {
  const [active, setActive] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [variantPick, setVariantPick] = useState<MenuItem | null>(null);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      const inCat = active === "all" || it.category?.slug === active;
      const q = search.trim().toLowerCase();
      const inSearch = !q || it.name.toLowerCase().includes(q);
      return inCat && inSearch;
    });
  }, [items, active, search]);

  return (
    <div className="h-screen grid grid-cols-1 lg:grid-cols-[1fr_460px]">
      {/* Menu grid */}
      <section className="flex flex-col min-w-0 border-r border-[var(--mm-line)]">
        <header className="p-5 border-b border-[var(--mm-line)] flex items-center gap-3">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] text-[var(--mm-tan)]">POS</span>
            <h1 className="font-display text-2xl">Order Builder</h1>
          </div>
          <div className="ml-auto relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--mm-cream)]/40" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search menu…"
              className="pl-10"
            />
          </div>
        </header>

        <div className="px-5 py-3 flex gap-2 overflow-x-auto scrollbar-thin border-b border-[var(--mm-line)]">
          <Chip active={active === "all"} onClick={() => setActive("all")}>All</Chip>
          {categories.map((c) => (
            <Chip key={c._id} active={active === c.slug} onClick={() => setActive(c.slug)}>
              {c.icon ? `${c.icon} ` : ""}{c.name}
            </Chip>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-5 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((it) => (
            <PosCard
              key={it._id}
              item={it}
              onPick={() => {
                if ((it.variants?.length ?? 0) > 0) setVariantPick(it);
                else
                  usePos.getState().add({
                    menuItemId: it._id,
                    name: it.name,
                    unitPrice: it.price,
                    variants: [],
                  });
              }}
            />
          ))}
        </div>
      </section>

      {/* Order panel */}
      <OrderPanel tables={tables} />

      <AnimatePresence>
        {variantPick && (
          <VariantModal item={variantPick} onClose={() => setVariantPick(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 px-4 py-2 rounded-full text-sm whitespace-nowrap transition",
        active
          ? "bg-[var(--mm-maroon)] text-[var(--mm-cream)]"
          : "text-[var(--mm-cream)]/70 hover:bg-[var(--mm-steam)]"
      )}
    >
      {children}
    </button>
  );
}

function PosCard({ item, onPick }: { item: MenuItem; onPick: () => void }) {
  const img = item.images?.[0]
    ? urlFor(item.images[0]).width(360).height(270).url()
    : null;
  return (
    <button
      onClick={onPick}
      className="group glass rounded-2xl overflow-hidden text-left active:scale-[0.98] transition hover:border-[var(--mm-maroon)]"
    >
      <div className="relative aspect-[4/3] bg-[var(--mm-ink)]">
        {img ? (
          <Image src={img} alt={item.name} fill className="object-cover" sizes="20vw" />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-4xl">🥢</div>
        )}
      </div>
      <div className="p-3">
        <div className="text-sm truncate">{item.name}</div>
        <div className="gold-text text-xs mt-1">{formatPKR(item.price)}</div>
      </div>
    </button>
  );
}

function OrderPanel({ tables }: { tables: Table[] }) {
  const pos = usePos();
  const staff = useStaffAuth((s) => s.staff);
  const [submitting, setSubmitting] = useState(false);
  const [cashAmount, setCashAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "unpaid">("cash");
  const [lastReceipt, setLastReceipt] = useState<{
    orderNumber: string;
    total: number;
    items: { name: string; quantity: number; unitPrice: number }[];
    paymentMethod: string;
    customerName?: string;
  } | null>(null);

  const subtotal = pos.subtotal();
  const total = pos.total();
  const change =
    paymentMethod === "cash" && cashAmount ? Math.max(0, Number(cashAmount) - total) : 0;

  async function send() {
    if (pos.items.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    if (pos.orderType === "dine-in" && !pos.tableNumber) {
      toast.error("Pick a table for dine-in");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: pos.orderType,
          items: pos.items.map((i) => ({
            menuItemId: i.menuItemId,
            name: i.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            variants: i.variants,
            notes: i.notes,
          })),
          subtotal,
          tax: pos.taxAmount(),
          discount: pos.discount,
          total,
          customerName: pos.customerName,
          customerPhone: pos.customerPhone,
          tableNumber: pos.tableNumber,
          paymentMethod,
          paymentStatus: paymentMethod === "unpaid" ? "pending" : "paid",
          source: "pos",
          staffId: staff?.id,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed");
      }
      const data = await res.json();
      toast.success(`Sent to kitchen · ${data.orderNumber}`);
      setLastReceipt({
        orderNumber: data.orderNumber,
        total,
        items: pos.items.map((i) => ({ name: i.name, quantity: i.quantity, unitPrice: i.unitPrice })),
        paymentMethod,
        customerName: pos.customerName,
      });
      if (data.lowStock?.length) {
        toast.warning(
          `Low stock: ${data.lowStock.map((s: { name: string }) => s.name).join(", ")}`
        );
      }
      pos.reset();
      setCashAmount("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <aside className="flex flex-col h-full bg-[var(--mm-ink)]/40">
      <div className="p-5 border-b border-[var(--mm-line)] flex gap-2">
        {(["dine-in", "pos-takeaway", "delivery"] as const).map((t) => (
          <button
            key={t}
            onClick={() => pos.setType(t)}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition",
              pos.orderType === t
                ? "bg-[var(--mm-maroon)] text-[var(--mm-cream)]"
                : "border border-[var(--mm-line)] hover:bg-[var(--mm-steam)]"
            )}
          >
            {t === "dine-in" ? "Dine-In" : t === "pos-takeaway" ? "Takeaway" : "Delivery"}
          </button>
        ))}
      </div>

      {pos.orderType === "dine-in" && (
        <div className="p-5 border-b border-[var(--mm-line)]">
          <div className="text-xs uppercase tracking-[0.3em] text-[var(--mm-tan)] mb-2">Table</div>
          <div className="flex gap-2 flex-wrap">
            {tables.length === 0 ? (
              <Input
                value={pos.tableNumber ?? ""}
                onChange={(e) => pos.setTable(e.target.value)}
                placeholder="Table #"
                className="max-w-32"
              />
            ) : (
              tables.map((t) => (
                <button
                  key={t._id}
                  onClick={() => pos.setTable(t.tableNumber)}
                  className={cn(
                    "h-12 w-12 rounded-xl text-sm font-semibold border transition",
                    pos.tableNumber === t.tableNumber
                      ? "bg-[var(--mm-maroon)] border-[var(--mm-maroon)] text-[var(--mm-cream)]"
                      : t.isOccupied
                      ? "border-amber-500/40 text-amber-300"
                      : "border-[var(--mm-line)] hover:bg-[var(--mm-steam)]"
                  )}
                >
                  {t.tableNumber}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <div className="p-5 border-b border-[var(--mm-line)] grid grid-cols-2 gap-2">
        <Input
          value={pos.customerName ?? ""}
          onChange={(e) => pos.setCustomer(e.target.value, pos.customerPhone)}
          placeholder="Customer name"
        />
        <Input
          value={pos.customerPhone ?? ""}
          onChange={(e) => pos.setCustomer(pos.customerName, e.target.value)}
          placeholder="Phone"
        />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-2">
        {pos.items.length === 0 ? (
          <div className="text-center text-[var(--mm-cream)]/50 py-12">
            Tap menu items to start an order.
          </div>
        ) : (
          pos.items.map((it) => {
            const lineTotal =
              (it.unitPrice + it.variants.reduce((m, v) => m + v.priceModifier, 0)) *
              it.quantity;
            return (
              <div key={it.lineId} className="glass rounded-2xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{it.name}</div>
                    {it.variants.length > 0 && (
                      <div className="text-[10px] text-[var(--mm-cream)]/50 uppercase tracking-wider">
                        {it.variants.map((v) => v.label).join(" · ")}
                      </div>
                    )}
                    {it.notes && (
                      <div className="text-xs text-[var(--mm-tan)]/80 italic mt-1">
                        “{it.notes}”
                      </div>
                    )}
                  </div>
                  <span className="text-sm gold-text whitespace-nowrap">
                    {formatPKR(lineTotal)}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => pos.setQty(it.lineId, it.quantity - 1)}
                    className="h-7 w-7 rounded-full bg-[var(--mm-steam)] grid place-items-center"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-sm w-5 text-center">{it.quantity}</span>
                  <button
                    onClick={() => pos.setQty(it.lineId, it.quantity + 1)}
                    className="h-7 w-7 rounded-full bg-[var(--mm-steam)] grid place-items-center"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <input
                    value={it.notes ?? ""}
                    onChange={(e) => pos.setNotes(it.lineId, e.target.value)}
                    placeholder="Note"
                    className="ml-2 flex-1 bg-transparent border-b border-[var(--mm-line)] text-xs px-1 py-0.5 focus:outline-none focus:border-[var(--mm-tan)]"
                  />
                  <button
                    onClick={() => pos.remove(it.lineId)}
                    className="h-7 w-7 grid place-items-center rounded-full text-red-300 hover:bg-red-900/30"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {pos.items.length > 0 && (
        <div className="border-t border-[var(--mm-line)] p-5 space-y-3 bg-[var(--mm-ink)]/80">
          <div className="text-sm flex justify-between">
            <span className="text-[var(--mm-cream)]/60">Subtotal</span>
            <span>{formatPKR(subtotal)}</span>
          </div>
          <div className="text-sm flex justify-between items-center">
            <span className="text-[var(--mm-cream)]/60">Discount</span>
            <input
              value={pos.discount}
              onChange={(e) => pos.setDiscount(Number(e.target.value) || 0)}
              type="number"
              className="w-24 text-right bg-transparent border-b border-[var(--mm-line)] py-0.5 px-1 focus:outline-none focus:border-[var(--mm-tan)]"
            />
          </div>
          <div className="text-base font-semibold flex justify-between">
            <span>Total</span>
            <span className="gold-text">{formatPKR(total)}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            {(["cash", "card", "unpaid"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                className={cn(
                  "py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition",
                  paymentMethod === m
                    ? "bg-[var(--mm-cream)] text-[var(--mm-ink)]"
                    : "border border-[var(--mm-line)] hover:bg-[var(--mm-steam)]"
                )}
              >
                {m}
              </button>
            ))}
          </div>

          {paymentMethod === "cash" && (
            <div className="grid grid-cols-2 gap-2 items-center">
              <Input
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                type="number"
                placeholder="Amount tendered"
              />
              <div className="text-sm text-right">
                Change:{" "}
                <span className="gold-text font-semibold">{formatPKR(change)}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button variant="ghost" onClick={() => pos.reset()}>
              <X className="h-4 w-4" /> Clear
            </Button>
            <Button variant="neon" onClick={send} disabled={submitting}>
              <Send className="h-4 w-4" />
              {submitting ? "Sending…" : "Send to Kitchen"}
            </Button>
          </div>
        </div>
      )}

      {lastReceipt && (
        <ReceiptOverlay receipt={lastReceipt} onClose={() => setLastReceipt(null)} />
      )}
    </aside>
  );
}

function VariantModal({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const [picks, setPicks] = useState<Record<string, { label: string; priceModifier: number }>>({});
  const variants = Object.entries(picks).map(([group, v]) => ({
    group,
    label: v.label,
    priceModifier: v.priceModifier,
  }));
  const total = item.price + variants.reduce((s, v) => s + v.priceModifier, 0);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] bg-black/70 grid place-items-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95 }}
        className="glass rounded-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-display text-xl">{item.name}</h3>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-full hover:bg-[var(--mm-steam)]">
            <X className="h-4 w-4" />
          </button>
        </div>
        {item.variants?.map((g) => (
          <div key={g.name} className="mb-4">
            <div className="text-xs uppercase tracking-wider text-[var(--mm-tan)] mb-2">{g.name}</div>
            <div className="flex flex-wrap gap-2">
              {g.options.map((o) => {
                const sel = picks[g.name]?.label === o.label;
                return (
                  <button
                    key={o.label}
                    onClick={() => setPicks((p) => ({ ...p, [g.name]: o }))}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs border",
                      sel
                        ? "bg-[var(--mm-maroon)] border-[var(--mm-maroon)] text-[var(--mm-cream)]"
                        : "border-[var(--mm-line)]"
                    )}
                  >
                    {o.label}
                    {o.priceModifier !== 0 && (
                      <span className="ml-2 text-[var(--mm-tan)]">
                        {o.priceModifier > 0 ? "+" : ""}
                        {formatPKR(o.priceModifier)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <Button
          variant="neon"
          className="w-full"
          onClick={() => {
            usePos.getState().add({
              menuItemId: item._id,
              name: item.name,
              unitPrice: item.price,
              variants,
            });
            onClose();
          }}
        >
          Add · {formatPKR(total)}
        </Button>
      </motion.div>
    </motion.div>
  );
}

type ReceiptData = {
  orderNumber: string;
  total: number;
  items: { name: string; quantity: number; unitPrice: number }[];
  paymentMethod: string;
  customerName?: string;
};

function ReceiptOverlay({
  receipt,
  onClose,
}: {
  receipt: ReceiptData;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/70 grid place-items-center p-4">
      <div className="bg-[#fff8ec] text-black rounded-2xl w-full max-w-sm p-6 font-mono text-sm shadow-2xl">
        <div className="text-center border-b border-dashed border-black/30 pb-3">
          <div className="font-display text-xl tracking-[0.3em]">MOOSA · MINISTRY</div>
          <div className="text-xs">Gulshan-e-Maymar · Karachi</div>
        </div>
        <div className="py-3 text-xs flex justify-between">
          <span>Order:</span>
          <span className="font-bold">{receipt.orderNumber}</span>
        </div>
        {receipt.customerName && (
          <div className="text-xs flex justify-between">
            <span>Customer:</span>
            <span>{receipt.customerName}</span>
          </div>
        )}
        <ul className="py-3 space-y-1 border-t border-dashed border-black/30">
          {receipt.items.map((i, idx) => (
            <li key={idx} className="flex justify-between">
              <span>
                {i.quantity}× {i.name}
              </span>
              <span>{formatPKR(i.unitPrice * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-dashed border-black/30 pt-3 flex justify-between font-bold">
          <span>Total</span>
          <span>{formatPKR(receipt.total)}</span>
        </div>
        <div className="text-xs flex justify-between mt-1">
          <span>Payment:</span>
          <Badge tone="cream" className="!text-black !border-black/30">
            {receipt.paymentMethod}
          </Badge>
        </div>
        <div className="text-center pt-3 mt-3 border-t border-dashed border-black/30 text-xs">
          감사합니다 · Thank you
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 no-print">
          <Button variant="ghost" onClick={onClose} className="!text-black !border-black/30">
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => window.print()}
            className="!bg-black !text-white"
          >
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>
    </div>
  );
}
