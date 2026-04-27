"use client";

import { useEffect, useState } from "react";
import { sanityClient } from "@/sanity/client";
import { allCategoriesQuery } from "@/sanity/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Toggle } from "@/components/dashboard/Field";
import { toast } from "sonner";
import { Trash2, Plus, X } from "lucide-react";

type Cat = {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  displayOrder: number;
  isActive?: boolean;
};

export default function CategoriesPage() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [editing, setEditing] = useState<Cat | null>(null);
  const [open, setOpen] = useState(false);

  async function load() {
    const r = await sanityClient.fetch<Cat[]>(allCategoriesQuery);
    setCats(r);
  }

  useEffect(() => {
    load();
    const sub = sanityClient
      .listen('*[_type=="category"]', {}, { visibility: "query" })
      .subscribe(() => load());
    return () => sub.unsubscribe();
  }, []);

  async function remove(id: string, name: string) {
    if (!confirm(`Delete "${name}"? Menu items in this category will become orphaned.`)) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) toast.success("Deleted");
    else toast.error("Failed");
  }

  return (
    <div className="p-6 md:p-10 space-y-6">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <span className="text-xs uppercase tracking-[0.4em] text-[var(--mm-tan)]">Menu</span>
          <h1 className="font-display text-4xl mt-2 brand-gradient-text">Categories</h1>
        </div>
        <Button variant="primary" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4" /> New Category
        </Button>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cats.map((c) => (
          <div key={c._id} className="glass rounded-2xl p-5 flex flex-col">
            <div className="flex items-start justify-between">
              <div className="text-3xl">{c.icon ?? "🥢"}</div>
              <span className={`text-[10px] uppercase tracking-wider ${c.isActive === false ? "text-red-300" : "text-emerald-300"}`}>
                {c.isActive === false ? "Hidden" : "Live"}
              </span>
            </div>
            <h3 className="font-display text-xl mt-3">{c.name}</h3>
            <div className="text-xs text-[var(--mm-cream)]/50 mt-1">
              /{c.slug} · order {c.displayOrder}
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="ghost" className="flex-1" onClick={() => { setEditing(c); setOpen(true); }}>
                Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(c._id, c.name)}>
                <Trash2 className="h-3.5 w-3.5 text-red-300" />
              </Button>
            </div>
          </div>
        ))}
        {cats.length === 0 && (
          <div className="glass rounded-2xl p-10 col-span-full text-center text-[var(--mm-cream)]/50">
            No categories yet. Click “New Category” to create one.
          </div>
        )}
      </div>

      {open && (
        <CategoryModal
          initial={editing}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function CategoryModal({ initial, onClose }: { initial: Cat | null; onClose: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "");
  const [order, setOrder] = useState(initial?.displayOrder ?? 0);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) return toast.error("Name required");
    setSaving(true);
    try {
      const url = initial ? `/api/categories/${initial._id}` : "/api/categories";
      const method = initial ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug: slug || undefined, icon, displayOrder: Number(order) || 0, isActive }),
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
          <h3 className="font-display text-2xl">{initial ? "Edit Category" : "New Category"}</h3>
          <button onClick={onClose} className="h-9 w-9 grid place-items-center rounded-full hover:bg-[var(--mm-steam)]">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Slug" hint="auto from name">
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="hotpot" />
            </Field>
            <Field label="Icon" hint="emoji or short text">
              <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🍲" />
            </Field>
          </div>
          <Field label="Display order">
            <Input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
          </Field>
          <Toggle checked={isActive} onChange={setIsActive} label="Active (visible on storefront)" />
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
