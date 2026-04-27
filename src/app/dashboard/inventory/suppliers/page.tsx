"use client";

import { useEffect, useState } from "react";
import { sanityClient } from "@/sanity/client";
import { groq } from "next-sanity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, TextArea } from "@/components/dashboard/Field";
import { toast } from "sonner";
import { Plus, Trash2, X, Pencil, Phone, Mail } from "lucide-react";

type Supplier = {
  _id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
};

const supplierQuery = groq`*[_type=="supplier"] | order(name asc){_id, name, contactPerson, phone, email, address}`;

export default function SuppliersPage() {
  const [list, setList] = useState<Supplier[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

  async function load() {
    const r = await sanityClient.fetch<Supplier[]>(supplierQuery);
    setList(r);
  }

  useEffect(() => {
    load();
    const sub = sanityClient
      .listen('*[_type=="supplier"]', {}, { visibility: "query" })
      .subscribe(() => load());
    return () => sub.unsubscribe();
  }, []);

  async function remove(id: string, name: string) {
    if (!confirm(`Delete supplier "${name}"?`)) return;
    const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
    if (res.ok) toast.success("Deleted");
    else toast.error("Failed");
  }

  return (
    <div className="p-6 md:p-10 space-y-6">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <span className="text-xs uppercase tracking-[0.4em] text-[var(--mm-tan)]">Inventory</span>
          <h1 className="font-display text-4xl mt-2 brand-gradient-text">Suppliers</h1>
        </div>
        <Button variant="primary" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4" /> New Supplier
        </Button>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((s) => (
          <div key={s._id} className="glass rounded-2xl p-5">
            <h3 className="font-display text-xl">{s.name}</h3>
            {s.contactPerson && <div className="text-sm text-[var(--mm-cream)]/70 mt-1">{s.contactPerson}</div>}
            <div className="mt-3 space-y-1 text-xs text-[var(--mm-cream)]/60">
              {s.phone && (
                <div className="flex items-center gap-2"><Phone className="h-3 w-3" /> {s.phone}</div>
              )}
              {s.email && (
                <div className="flex items-center gap-2"><Mail className="h-3 w-3" /> {s.email}</div>
              )}
              {s.address && <div className="text-[var(--mm-cream)]/50">{s.address}</div>}
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="ghost" className="flex-1" onClick={() => { setEditing(s); setOpen(true); }}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(s._id, s.name)}>
                <Trash2 className="h-3.5 w-3.5 text-red-300" />
              </Button>
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <div className="glass rounded-2xl p-12 col-span-full text-center text-[var(--mm-cream)]/50">
            No suppliers yet.
          </div>
        )}
      </div>

      {open && <SupplierModal initial={editing} onClose={() => setOpen(false)} />}
    </div>
  );
}

function SupplierModal({ initial, onClose }: { initial: Supplier | null; onClose: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [contactPerson, setContactPerson] = useState(initial?.contactPerson ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) return toast.error("Name required");
    setSaving(true);
    try {
      const url = initial ? `/api/suppliers/${initial._id}` : "/api/suppliers";
      const method = initial ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, contactPerson, phone, email, address }),
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
      <div className="glass rounded-3xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-2xl">{initial ? "Edit Supplier" : "New Supplier"}</h3>
          <button onClick={onClose} className="h-9 w-9 grid place-items-center rounded-full hover:bg-[var(--mm-steam)]">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Contact person">
            <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
          </div>
          <Field label="Address">
            <TextArea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
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
