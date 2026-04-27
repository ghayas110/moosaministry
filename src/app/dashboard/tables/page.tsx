"use client";

import { useEffect, useState } from "react";
import { sanityClient } from "@/sanity/client";
import { tablesQuery } from "@/sanity/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Select, Toggle } from "@/components/dashboard/Field";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, X, Pencil } from "lucide-react";

type Table = {
  _id: string;
  tableNumber: string;
  section: "main" | "patio" | "private" | "bar";
  capacity: number;
  isOccupied: boolean;
  currentOrder?: { _id: string; orderNumber: string; total: number };
};

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Table | null>(null);

  async function load() {
    const r = await sanityClient.fetch<Table[]>(tablesQuery);
    setTables(r);
  }

  useEffect(() => {
    load();
    const sub = sanityClient
      .listen('*[_type=="table"]', {}, { visibility: "query" })
      .subscribe(() => load());
    return () => sub.unsubscribe();
  }, []);

  async function remove(id: string, n: string) {
    if (!confirm(`Delete Table ${n}?`)) return;
    const res = await fetch(`/api/tables/${id}`, { method: "DELETE" });
    if (res.ok) toast.success("Deleted");
    else toast.error("Failed");
  }

  async function toggleOccupied(t: Table) {
    await fetch(`/api/tables/${t._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isOccupied: !t.isOccupied }),
    });
  }

  return (
    <div className="p-6 md:p-10 space-y-6">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <span className="text-xs uppercase tracking-[0.4em] text-[var(--mm-tan)]">Operations</span>
          <h1 className="font-display text-4xl mt-2 brand-gradient-text">Tables</h1>
        </div>
        <Button variant="primary" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4" /> New Table
        </Button>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map((t) => (
          <div key={t._id} className="glass rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-[var(--mm-tan)]">Table</div>
                <div className="font-display text-3xl">{t.tableNumber}</div>
              </div>
              <Badge tone={t.isOccupied ? "warn" : "ok"}>
                {t.isOccupied ? "Occupied" : "Free"}
              </Badge>
            </div>
            <div className="mt-3 text-xs text-[var(--mm-cream)]/60">
              {t.section} · seats {t.capacity}
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="ghost" className="flex-1" onClick={() => { setEditing(t); setOpen(true); }}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => toggleOccupied(t)}>
                {t.isOccupied ? "Free" : "Occupy"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(t._id, t.tableNumber)}>
                <Trash2 className="h-3.5 w-3.5 text-red-300" />
              </Button>
            </div>
          </div>
        ))}
        {tables.length === 0 && (
          <div className="glass rounded-2xl p-12 col-span-full text-center text-[var(--mm-cream)]/50">
            No tables yet.
          </div>
        )}
      </div>

      {open && <TableModal initial={editing} onClose={() => setOpen(false)} />}
    </div>
  );
}

function TableModal({ initial, onClose }: { initial: Table | null; onClose: () => void }) {
  const [num, setNum] = useState(initial?.tableNumber ?? "");
  const [section, setSection] = useState<Table["section"]>(initial?.section ?? "main");
  const [capacity, setCapacity] = useState(initial?.capacity ?? 4);
  const [isOccupied, setIsOccupied] = useState(initial?.isOccupied ?? false);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!num.trim()) return toast.error("Number required");
    setSaving(true);
    try {
      const url = initial ? `/api/tables/${initial._id}` : "/api/tables";
      const method = initial ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableNumber: num, section, capacity: Number(capacity) || 1, isOccupied }),
      });
      if (!res.ok) throw new Error();
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
      <div className="glass rounded-3xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-2xl">{initial ? "Edit Table" : "New Table"}</h3>
          <button onClick={onClose} className="h-9 w-9 grid place-items-center rounded-full hover:bg-[var(--mm-steam)]">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4">
          <Field label="Table number">
            <Input value={num} onChange={(e) => setNum(e.target.value)} placeholder="e.g. 1, A2, VIP1" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Section">
              <Select value={section} onChange={(e) => setSection(e.target.value as Table["section"])}>
                <option value="main">Main</option>
                <option value="patio">Patio</option>
                <option value="private">Private</option>
                <option value="bar">Bar</option>
              </Select>
            </Field>
            <Field label="Capacity">
              <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
            </Field>
          </div>
          <Toggle checked={isOccupied} onChange={setIsOccupied} label="Occupied" />
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
