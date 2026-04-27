"use client";

import { useEffect, useState } from "react";
import { sanityClient } from "@/sanity/client";
import { groq } from "next-sanity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Field, Select, Toggle } from "@/components/dashboard/Field";
import { toast } from "sonner";
import { Plus, Trash2, X, Pencil } from "lucide-react";

type Staff = {
  _id: string;
  name: string;
  role: "cashier" | "manager" | "admin" | "kitchen";
  pin: string;
  isActive: boolean;
};

const staffQuery = groq`*[_type=="staff"] | order(name asc){_id, name, role, pin, isActive}`;

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);

  async function load() {
    const r = await sanityClient.fetch<Staff[]>(staffQuery);
    setStaff(r);
  }

  useEffect(() => {
    load();
    const sub = sanityClient
      .listen('*[_type=="staff"]', {}, { visibility: "query" })
      .subscribe(() => load());
    return () => sub.unsubscribe();
  }, []);

  async function remove(id: string, n: string) {
    if (!confirm(`Remove ${n}?`)) return;
    const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
    if (res.ok) toast.success("Removed");
    else toast.error("Failed");
  }

  return (
    <div className="p-6 md:p-10 space-y-6">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <span className="text-xs uppercase tracking-[0.4em] text-[var(--mm-tan)]">Operations</span>
          <h1 className="font-display text-4xl mt-2 brand-gradient-text">Staff</h1>
          <p className="mt-2 text-sm text-[var(--mm-cream)]/60 max-w-xl">
            Each staff member needs a 4–6 digit PIN to access the dashboard.
          </p>
        </div>
        <Button variant="primary" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4" /> New Staff
        </Button>
      </header>

      <div className="glass rounded-3xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.2em] text-[var(--mm-cream)]/50 bg-[var(--mm-ink)]/60">
              <th className="text-left p-4">Name</th>
              <th className="text-left">Role</th>
              <th className="text-left">PIN</th>
              <th className="text-left">Status</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s._id} className="border-t border-[var(--mm-line)]">
                <td className="p-4">{s.name}</td>
                <td>
                  <Badge tone={s.role === "admin" ? "neon" : "cream"}>{s.role}</Badge>
                </td>
                <td className="font-mono">{"•".repeat(s.pin?.length ?? 4)}</td>
                <td>
                  <Badge tone={s.isActive ? "ok" : "danger"}>{s.isActive ? "Active" : "Disabled"}</Badge>
                </td>
                <td className="text-right p-4 space-x-1">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(s); setOpen(true); }}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(s._id, s.name)}>
                    <Trash2 className="h-3.5 w-3.5 text-red-300" />
                  </Button>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr><td colSpan={5} className="text-center py-10 text-[var(--mm-cream)]/50">No staff yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && <StaffModal initial={editing} onClose={() => setOpen(false)} />}
    </div>
  );
}

function StaffModal({ initial, onClose }: { initial: Staff | null; onClose: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [role, setRole] = useState<Staff["role"]>(initial?.role ?? "cashier");
  const [pin, setPin] = useState(initial?.pin ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) return toast.error("Name required");
    if (!/^\d{4,6}$/.test(pin)) return toast.error("PIN must be 4–6 digits");
    setSaving(true);
    try {
      const url = initial ? `/api/staff/${initial._id}` : "/api/staff";
      const method = initial ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role, pin, isActive }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "save failed");
      }
      toast.success(initial ? "Updated" : "Added");
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 grid place-items-center p-4" onClick={onClose}>
      <div className="glass rounded-3xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-2xl">{initial ? "Edit Staff" : "New Staff"}</h3>
          <button onClick={onClose} className="h-9 w-9 grid place-items-center rounded-full hover:bg-[var(--mm-steam)]">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Role">
              <Select value={role} onChange={(e) => setRole(e.target.value as Staff["role"])}>
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
                <option value="kitchen">Kitchen</option>
              </Select>
            </Field>
            <Field label="PIN" hint="4–6 digits">
              <Input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="1234" />
            </Field>
          </div>
          <Toggle checked={isActive} onChange={setIsActive} label="Active (can log in)" />
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
