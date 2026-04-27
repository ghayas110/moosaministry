"use client";

import { useEffect, useState } from "react";
import { sanityClient } from "@/sanity/client";
import { ingredientsQuery } from "@/sanity/queries";
import { groq } from "next-sanity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Field, Select, TextArea } from "@/components/dashboard/Field";
import { toast } from "sonner";
import { useStaffAuth } from "@/store/staffAuth";
import { Search, Plus, Trash2, Pencil, X } from "lucide-react";

type Ingredient = {
  _id: string;
  name: string;
  category?: "raw" | "packaging" | "beverages" | "sauces" | "other";
  unit: "kg" | "g" | "L" | "ml" | "pieces" | "portions" | "packs";
  currentStock: number;
  restockThreshold: number;
  costPerUnit: number;
  notes?: string;
  lastRestocked?: string;
  supplier?: { _id: string; name: string; phone?: string };
};
type Supplier = { _id: string; name: string };

export default function ItemsPage() {
  const [items, setItems] = useState<Ingredient[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const staff = useStaffAuth((s) => s.staff);

  async function load() {
    const [ing, sup] = await Promise.all([
      sanityClient.fetch<Ingredient[]>(ingredientsQuery),
      sanityClient.fetch<Supplier[]>(groq`*[_type=="supplier"] | order(name asc){_id, name}`),
    ]);
    setItems(ing);
    setSuppliers(sup);
  }

  useEffect(() => {
    load();
    const sub = sanityClient
      .listen('*[_type in ["ingredient","supplier"]]', {}, { visibility: "query" })
      .subscribe(() => load());
    return () => sub.unsubscribe();
  }, []);

  const filtered = items.filter((i) =>
    !q || i.name.toLowerCase().includes(q.toLowerCase())
  );

  async function restock(id: string) {
    const qty = Number(prompt("Quantity to add"));
    if (!qty || qty <= 0) return;
    const res = await fetch("/api/inventory/restock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredientId: id, quantity: qty, performedBy: staff?.name }),
    });
    if (res.ok) toast.success("Restocked");
    else toast.error("Failed");
  }

  async function adjust(id: string, type: "waste" | "adjustment") {
    const change = Number(prompt("Change (+ or - number)"));
    if (!change) return;
    const reason = prompt("Reason") ?? "";
    const res = await fetch("/api/inventory/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredientId: id, change, type, reason, performedBy: staff?.name }),
    });
    if (res.ok) toast.success("Adjusted");
    else toast.error("Failed");
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete ingredient "${name}"? Recipes referencing it may break.`)) return;
    const res = await fetch(`/api/ingredients/${id}`, { method: "DELETE" });
    if (res.ok) toast.success("Deleted");
    else toast.error("Failed");
  }

  return (
    <div className="p-6 md:p-10 space-y-6">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <span className="text-xs uppercase tracking-[0.4em] text-[var(--mm-tan)]">Inventory</span>
          <h1 className="font-display text-4xl mt-2 brand-gradient-text">Ingredients</h1>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--mm-cream)]/40" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search ingredient…"
              className="pl-10 w-72"
            />
          </div>
          <Button variant="primary" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4" /> New Ingredient
          </Button>
        </div>
      </header>

      <div className="glass rounded-3xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.2em] text-[var(--mm-cream)]/50 bg-[var(--mm-ink)]/60">
              <th className="text-left p-4">Item</th>
              <th className="text-left">Stock</th>
              <th className="text-left">Threshold</th>
              <th className="text-left">Cost / unit</th>
              <th className="text-left">Supplier</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => {
              const low = i.currentStock <= i.restockThreshold;
              const out = i.currentStock <= 0;
              return (
                <tr key={i._id} className="border-t border-[var(--mm-line)]">
                  <td className="p-4">{i.name}</td>
                  <td>
                    <Badge tone={out ? "danger" : low ? "warn" : "ok"}>
                      {i.currentStock} {i.unit}
                    </Badge>
                  </td>
                  <td className="text-[var(--mm-cream)]/60">{i.restockThreshold} {i.unit}</td>
                  <td className="text-[var(--mm-cream)]/60">
                    {i.costPerUnit ? `PKR ${i.costPerUnit}` : "—"}
                  </td>
                  <td className="text-[var(--mm-cream)]/60">{i.supplier?.name ?? "—"}</td>
                  <td className="text-right p-4">
                    <div className="flex gap-1 flex-wrap justify-end">
                      <Button size="sm" variant="ghost" onClick={() => restock(i._id)}>+ Restock</Button>
                      <Button size="sm" variant="ghost" onClick={() => adjust(i._id, "waste")}>Waste</Button>
                      <Button size="sm" variant="ghost" onClick={() => adjust(i._id, "adjustment")}>Adjust</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(i); setOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(i._id, i.name)}>
                        <Trash2 className="h-3.5 w-3.5 text-red-300" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-[var(--mm-cream)]/50">
                  No ingredients match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <IngredientModal
          initial={editing}
          suppliers={suppliers}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function IngredientModal({
  initial, suppliers, onClose,
}: {
  initial: Ingredient | null;
  suppliers: Supplier[];
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<NonNullable<Ingredient["category"]>>(initial?.category ?? "raw");
  const [unit, setUnit] = useState<Ingredient["unit"]>(initial?.unit ?? "kg");
  const [currentStock, setCurrentStock] = useState(initial?.currentStock ?? 0);
  const [restockThreshold, setRestockThreshold] = useState(initial?.restockThreshold ?? 5);
  const [costPerUnit, setCostPerUnit] = useState(initial?.costPerUnit ?? 0);
  const [supplierId, setSupplierId] = useState<string>(initial?.supplier?._id ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) return toast.error("Name required");
    setSaving(true);
    try {
      const url = initial ? `/api/ingredients/${initial._id}` : "/api/ingredients";
      const method = initial ? "PATCH" : "POST";
      const body: Record<string, unknown> = {
        name,
        category,
        unit,
        currentStock: Number(currentStock) || 0,
        restockThreshold: Number(restockThreshold) || 0,
        costPerUnit: Number(costPerUnit) || 0,
        notes,
      };
      if (initial) {
        body.supplierId = supplierId || null;
      } else if (supplierId) {
        body.supplierId = supplierId;
      }
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("save failed");
      toast.success(initial ? "Updated" : "Created");
      onClose();
    } catch {
      toast.error("Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 grid place-items-center p-4" onClick={onClose}>
      <div className="glass rounded-3xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-2xl">{initial ? "Edit Ingredient" : "New Ingredient"}</h3>
          <button onClick={onClose} className="h-9 w-9 grid place-items-center rounded-full hover:bg-[var(--mm-steam)]">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <Select value={category} onChange={(e) => setCategory(e.target.value as typeof category)}>
                <option value="raw">Raw Ingredients</option>
                <option value="packaging">Packaging</option>
                <option value="beverages">Beverages</option>
                <option value="sauces">Sauces & Condiments</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="Unit">
              <Select value={unit} onChange={(e) => setUnit(e.target.value as Ingredient["unit"])}>
                {["kg", "g", "L", "ml", "pieces", "portions", "packs"].map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Current stock">
              <Input type="number" step="0.01" value={currentStock} onChange={(e) => setCurrentStock(Number(e.target.value))} />
            </Field>
            <Field label="Restock at">
              <Input type="number" step="0.01" value={restockThreshold} onChange={(e) => setRestockThreshold(Number(e.target.value))} />
            </Field>
            <Field label="Cost / unit">
              <Input type="number" step="0.01" value={costPerUnit} onChange={(e) => setCostPerUnit(Number(e.target.value))} />
            </Field>
          </div>
          <Field label="Supplier" hint="Optional">
            <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">— None —</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Notes">
            <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="neon" onClick={save} disabled={saving}>
            {saving ? "Saving…" : initial ? "Save" : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
}
