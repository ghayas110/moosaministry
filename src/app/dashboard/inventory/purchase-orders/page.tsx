"use client";

import { useEffect, useState } from "react";
import { sanityClient } from "@/sanity/client";
import { ingredientsQuery, purchaseOrdersQuery } from "@/sanity/queries";
import { groq } from "next-sanity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useStaffAuth } from "@/store/staffAuth";
import { formatPKR, relativeTime } from "@/lib/utils";
import { Plus, X, PackageCheck, Trash2 } from "lucide-react";

type PO = {
  _id: string;
  poNumber: string;
  status: "pending" | "received" | "cancelled";
  totalCost: number;
  expectedDelivery?: string;
  receivedAt?: string;
  _createdAt: string;
  supplier?: { name: string; phone?: string };
  items?: { ingredient?: { name: string; unit: string }; quantity: number; unitCost: number }[];
};

type Supplier = { _id: string; name: string };
type Ingredient = { _id: string; name: string; unit: string; costPerUnit?: number };

export default function PurchaseOrdersPage() {
  const [pos, setPos] = useState<PO[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [open, setOpen] = useState(false);
  const staff = useStaffAuth((s) => s.staff);

  useEffect(() => {
    async function load() {
      const [poList, sup, ing] = await Promise.all([
        sanityClient.fetch<PO[]>(purchaseOrdersQuery),
        sanityClient.fetch<Supplier[]>(groq`*[_type=="supplier"]{_id,name}`),
        sanityClient.fetch<Ingredient[]>(ingredientsQuery),
      ]);
      setPos(poList);
      setSuppliers(sup);
      setIngredients(ing);
    }
    load();
    const sub = sanityClient
      .listen('*[_type=="purchaseOrder"]', {}, { visibility: "query" })
      .subscribe(() => load());
    return () => sub.unsubscribe();
  }, []);

  async function receive(id: string) {
    if (!confirm("Mark as received? This will increase stock for all line items.")) return;
    const res = await fetch(`/api/inventory/purchase-orders/${id}/receive`, { method: "POST" });
    if (res.ok) toast.success("Received — stock updated");
    else toast.error("Failed");
  }

  async function remove(id: string, n: string) {
    if (!confirm(`Delete PO ${n}?`)) return;
    const res = await fetch(`/api/inventory/purchase-orders/${id}`, { method: "DELETE" });
    if (res.ok) toast.success("Deleted");
    else toast.error("Failed");
  }

  return (
    <div className="p-6 md:p-10 space-y-6">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <span className="text-xs uppercase tracking-[0.4em] text-[var(--mm-tan)]">Inventory</span>
          <h1 className="font-display text-4xl mt-2 brand-gradient-text">Purchase Orders</h1>
        </div>
        <Button variant="primary" onClick={() => setOpen(true)} disabled={suppliers.length === 0 || ingredients.length === 0}>
          <Plus className="h-4 w-4" /> New PO
        </Button>
      </header>

      <div className="glass rounded-3xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.2em] text-[var(--mm-cream)]/50 bg-[var(--mm-ink)]/60">
              <th className="text-left p-4">PO #</th>
              <th className="text-left">Supplier</th>
              <th className="text-left">Items</th>
              <th className="text-left">Total</th>
              <th className="text-left">Expected</th>
              <th className="text-left">Status</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pos.map((po) => (
              <tr key={po._id} className="border-t border-[var(--mm-line)]">
                <td className="p-4 font-mono text-[var(--mm-tan)]">{po.poNumber}</td>
                <td>{po.supplier?.name ?? "—"}</td>
                <td className="text-[var(--mm-cream)]/70">
                  {(po.items ?? []).slice(0, 2).map((i, idx) => (
                    <div key={idx} className="text-xs">
                      {i.ingredient?.name} × {i.quantity}
                    </div>
                  ))}
                  {(po.items?.length ?? 0) > 2 && (
                    <div className="text-xs text-[var(--mm-cream)]/40">+{(po.items?.length ?? 0) - 2} more</div>
                  )}
                </td>
                <td className="gold-text">{formatPKR(po.totalCost)}</td>
                <td className="text-[var(--mm-cream)]/60 text-xs">
                  {po.expectedDelivery ? new Date(po.expectedDelivery).toLocaleDateString() : "—"}
                </td>
                <td>
                  <Badge tone={po.status === "received" ? "ok" : po.status === "cancelled" ? "danger" : "warn"}>
                    {po.status}
                  </Badge>
                  {po.receivedAt && (
                    <div className="text-[10px] text-[var(--mm-cream)]/40 mt-1">
                      {relativeTime(po.receivedAt)}
                    </div>
                  )}
                </td>
                <td className="text-right p-4">
                  <div className="flex gap-1 justify-end">
                    {po.status === "pending" && (
                      <Button size="sm" variant="primary" onClick={() => receive(po._id)}>
                        <PackageCheck className="h-3 w-3" /> Receive
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => remove(po._id, po.poNumber)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-300" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {pos.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-[var(--mm-cream)]/50">
                  No purchase orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <CreatePOModal
          suppliers={suppliers}
          ingredients={ingredients}
          createdBy={staff?.name}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function CreatePOModal({
  suppliers, ingredients, createdBy, onClose,
}: {
  suppliers: Supplier[];
  ingredients: Ingredient[];
  createdBy?: string;
  onClose: () => void;
}) {
  const [supplierId, setSupplierId] = useState(suppliers[0]?._id ?? "");
  const [expected, setExpected] = useState("");
  const [lines, setLines] = useState<{ ingredientId: string; quantity: number; unitCost: number }[]>(
    [{ ingredientId: ingredients[0]?._id ?? "", quantity: 1, unitCost: ingredients[0]?.costPerUnit ?? 0 }]
  );
  const [submitting, setSubmitting] = useState(false);

  const total = lines.reduce((s, l) => s + l.quantity * l.unitCost, 0);

  async function submit() {
    if (!supplierId || lines.length === 0) {
      toast.error("Pick a supplier and at least one item");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/inventory/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          items: lines.filter((l) => l.ingredientId && l.quantity > 0),
          expectedDelivery: expected || undefined,
          createdBy,
        }),
      });
      if (!res.ok) throw new Error("failed");
      toast.success("PO created");
      onClose();
    } catch {
      toast.error("Could not create PO");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 grid place-items-center p-4" onClick={onClose}>
      <div className="glass rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-[var(--mm-line)] flex items-center justify-between">
          <h3 className="font-display text-2xl">New Purchase Order</h3>
          <button onClick={onClose} className="h-9 w-9 grid place-items-center rounded-full hover:bg-[var(--mm-steam)]">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-[var(--mm-tan)]">Supplier</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="mt-2 w-full bg-[var(--mm-ink)]/60 border border-[var(--mm-line)] rounded-md h-11 px-3 text-sm"
              >
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-[var(--mm-tan)]">Expected delivery</label>
              <Input type="date" value={expected} onChange={(e) => setExpected(e.target.value)} className="mt-2" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.3em] text-[var(--mm-tan)]">Line items</div>
            {lines.map((l, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <select
                  value={l.ingredientId}
                  onChange={(e) => {
                    const ing = ingredients.find((i) => i._id === e.target.value);
                    setLines((arr) => arr.map((x, i) => i === idx ? { ...x, ingredientId: e.target.value, unitCost: ing?.costPerUnit ?? x.unitCost } : x));
                  }}
                  className="col-span-6 bg-[var(--mm-ink)]/60 border border-[var(--mm-line)] rounded-md h-10 px-3 text-sm"
                >
                  {ingredients.map((i) => (
                    <option key={i._id} value={i._id}>{i.name} ({i.unit})</option>
                  ))}
                </select>
                <Input
                  type="number"
                  className="col-span-2 h-10"
                  value={l.quantity}
                  onChange={(e) => {
                    const v = Number(e.target.value) || 0;
                    setLines((arr) => arr.map((x, i) => (i === idx ? { ...x, quantity: v } : x)));
                  }}
                />
                <Input
                  type="number"
                  className="col-span-3 h-10"
                  placeholder="Unit cost"
                  value={l.unitCost}
                  onChange={(e) => {
                    const v = Number(e.target.value) || 0;
                    setLines((arr) => arr.map((x, i) => (i === idx ? { ...x, unitCost: v } : x)));
                  }}
                />
                <button
                  onClick={() => setLines((arr) => arr.filter((_, i) => i !== idx))}
                  className="col-span-1 text-red-300 hover:text-red-400 text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setLines((arr) => [...arr, { ingredientId: ingredients[0]?._id ?? "", quantity: 1, unitCost: 0 }])
              }
            >
              + Add line
            </Button>
          </div>

          <div className="flex justify-between items-center border-t border-[var(--mm-line)] pt-4">
            <span className="text-sm text-[var(--mm-cream)]/60">Total</span>
            <span className="gold-text font-semibold text-lg">{formatPKR(total)}</span>
          </div>
        </div>
        <div className="p-6 border-t border-[var(--mm-line)] flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="neon" onClick={submit} disabled={submitting}>
            {submitting ? "Creating…" : "Create PO"}
          </Button>
        </div>
      </div>
    </div>
  );
}
