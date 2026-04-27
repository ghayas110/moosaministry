"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { sanityClient, urlFor } from "@/sanity/client";
import { allCategoriesQuery, menuItemsQuery } from "@/sanity/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPKR, cn } from "@/lib/utils";
import { Plus, Trash2, Search, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { MenuCategory, MenuItem } from "@/components/storefront/MenuExplorer";

export default function MenuItemsPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cats, setCats] = useState<MenuCategory[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  async function load() {
    const [i, c] = await Promise.all([
      sanityClient.fetch<MenuItem[]>(menuItemsQuery),
      sanityClient.fetch<MenuCategory[]>(allCategoriesQuery),
    ]);
    setItems(i);
    setCats(c);
  }

  useEffect(() => {
    load();
    const sub = sanityClient
      .listen('*[_type in ["menuItem","category"]]', {}, { visibility: "query" })
      .subscribe(() => load());
    return () => sub.unsubscribe();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      const inCat = filter === "all" || it.category?.slug === filter;
      const q = search.trim().toLowerCase();
      const inSearch = !q || it.name.toLowerCase().includes(q);
      return inCat && inSearch;
    });
  }, [items, search, filter]);

  async function remove(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    const res = await fetch(`/api/menu-items/${id}`, { method: "DELETE" });
    if (res.ok) toast.success("Deleted");
    else toast.error("Failed");
  }

  return (
    <div className="p-6 md:p-10 space-y-6">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <span className="text-xs uppercase tracking-[0.4em] text-[var(--mm-tan)]">Menu</span>
          <h1 className="font-display text-4xl mt-2 brand-gradient-text">Menu Items</h1>
        </div>
        <div className="flex gap-3 items-center">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--mm-cream)]/40" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="pl-10" />
          </div>
          <Button asChild variant="primary">
            <Link href="/dashboard/menu/items/new">
              <Plus className="h-4 w-4" /> New Item
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto scrollbar-thin">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>All</Chip>
        {cats.map((c) => (
          <Chip key={c._id} active={filter === c.slug} onClick={() => setFilter(c.slug)}>
            {c.icon ? `${c.icon} ` : ""}{c.name}
          </Chip>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((it) => {
          const img = it.images?.[0] ? urlFor(it.images[0]).width(360).height(270).url() : null;
          return (
            <div key={it._id} className="glass rounded-2xl overflow-hidden flex flex-col">
              <div className="relative aspect-[4/3] bg-[var(--mm-ink)]">
                {img ? (
                  <Image src={img} alt={it.name} fill className="object-cover" sizes="20vw" />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-5xl opacity-40">🍜</div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                  {it.category?.name && <Badge tone="cream">{it.category.name}</Badge>}
                </div>
                <div className="absolute top-2 right-2">
                  {it.spiceLevel ? <Badge tone="neon">{"🌶".repeat(Math.max(1, it.spiceLevel))}</Badge> : null}
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-lg leading-tight">{it.name}</h3>
                  <span className="gold-text font-semibold whitespace-nowrap text-sm">{formatPKR(it.price)}</span>
                </div>
                {it.description && (
                  <p className="text-xs text-[var(--mm-cream)]/55 mt-2 line-clamp-2 flex-1">{it.description}</p>
                )}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/dashboard/menu/items/${it._id}/edit`}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Link>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(it._id, it.name)}>
                    <Trash2 className="h-3.5 w-3.5 text-red-300" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="glass rounded-2xl p-12 col-span-full text-center text-[var(--mm-cream)]/50">
            No menu items match.
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 px-4 py-2 rounded-full text-sm whitespace-nowrap transition",
        active
          ? "bg-[var(--mm-maroon)] text-[var(--mm-cream)]"
          : "border border-[var(--mm-line)] hover:bg-[var(--mm-steam)]"
      )}
    >
      {children}
    </button>
  );
}
