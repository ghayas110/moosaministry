"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { urlFor } from "@/sanity/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/store/cart";
import { formatPKR, cn } from "@/lib/utils";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { CustomizeModal } from "./CustomizeModal";

export type MenuItem = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  spiceLevel?: number;
  images?: { asset: { _ref: string } }[];
  isFeatured?: boolean;
  allergens?: string[];
  tags?: string[];
  category?: { _id: string; name: string; slug: string };
  variants?: {
    name: string;
    options: { label: string; priceModifier: number }[];
  }[];
};

export type MenuCategory = {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
};

export function MenuExplorer({
  categories,
  items,
}: {
  categories: MenuCategory[];
  items: MenuItem[];
}) {
  const [active, setActive] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<MenuItem | null>(null);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      const inCat = active === "all" || it.category?.slug === active;
      const q = search.trim().toLowerCase();
      const inSearch =
        !q ||
        it.name.toLowerCase().includes(q) ||
        it.description?.toLowerCase().includes(q);
      return inCat && inSearch;
    });
  }, [items, active, search]);

  return (
    <div className="pt-32 pb-24 mx-auto max-w-7xl px-4 md:px-8">
      <header className="text-center mb-10">
        <span className="text-xs uppercase tracking-[0.4em] text-[var(--mm-tan)]">
          The Menu
        </span>
        <h1 className="font-display text-5xl md:text-7xl mt-4 brand-gradient-text">
          Built for the Senses
        </h1>
        <p className="mt-4 text-[var(--mm-cream)]/60 max-w-xl mx-auto">
          Pick your bowl. Tweak the heat. We&apos;ll do the steam.
        </p>
      </header>

      <div className="sticky top-24 z-30 mb-10 glass rounded-2xl p-3 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--mm-cream)]/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dishes — “tonkotsu”, “mandu”, “kimchi”…"
            className="w-full bg-transparent pl-10 pr-3 py-2 text-sm focus:outline-none placeholder:text-[var(--mm-cream)]/40"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto scrollbar-thin md:flex-wrap">
          <CategoryChip active={active === "all"} onClick={() => setActive("all")}>
            All
          </CategoryChip>
          {categories.map((c) => (
            <CategoryChip
              key={c._id}
              active={active === c.slug}
              onClick={() => setActive(c.slug)}
            >
              {c.icon && <span className="mr-1">{c.icon}</span>}
              {c.name}
            </CategoryChip>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass rounded-3xl p-16 text-center text-[var(--mm-cream)]/60">
          No dishes match. Try a different category or clear the search.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((it) => (
              <MenuCard key={it._id} item={it} onCustomize={() => setPicked(it)} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <CustomizeModal item={picked} onClose={() => setPicked(null)} />
    </div>
  );
}

function CategoryChip({
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
        "shrink-0 px-4 py-2 rounded-full text-sm transition-colors",
        active
          ? "bg-[var(--mm-maroon)] text-[var(--mm-cream)]"
          : "text-[var(--mm-cream)]/70 hover:bg-[var(--mm-steam)]"
      )}
    >
      {children}
    </button>
  );
}

function MenuCard({
  item,
  onCustomize,
}: {
  item: MenuItem;
  onCustomize: () => void;
}) {
  const add = useCart((s) => s.addItem);
  const open = useCart((s) => s.open);
  const img = item.images?.[0]
    ? urlFor(item.images[0]).width(720).height(540).url()
    : null;

  const hasVariants = (item.variants?.length ?? 0) > 0;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group glass rounded-3xl overflow-hidden flex flex-col"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--mm-ink)]">
        {img ? (
          <Image
            src={img}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-7xl opacity-60">
            🥢
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1 flex-wrap">
          {item.tags?.includes("signature") && <Badge tone="gold">Signature</Badge>}
          {item.tags?.includes("new") && <Badge tone="neon">New</Badge>}
          {item.tags?.includes("vegan") && <Badge tone="ok">Vegan</Badge>}
        </div>
        {item.spiceLevel ? (
          <div className="absolute top-3 right-3">
            <Badge tone="neon">{"🌶".repeat(Math.max(1, item.spiceLevel))}</Badge>
          </div>
        ) : null}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl">{item.name}</h3>
          <span className="gold-text font-semibold whitespace-nowrap">
            {formatPKR(item.price)}
          </span>
        </div>
        {item.description && (
          <p className="mt-2 text-sm text-[var(--mm-cream)]/55 line-clamp-2 flex-1">
            {item.description}
          </p>
        )}
        <div className="mt-4 flex gap-2">
          {hasVariants ? (
            <Button onClick={onCustomize} variant="primary" className="flex-1">
              Customize · Add
            </Button>
          ) : (
            <Button
              onClick={() => {
                add({
                  menuItemId: item._id,
                  name: item.name,
                  unitPrice: item.price,
                  variants: [],
                });
                toast.success(`${item.name} added`);
                open();
              }}
              variant="primary"
              className="flex-1"
            >
              <Plus className="h-4 w-4" /> Add to Cart
            </Button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

