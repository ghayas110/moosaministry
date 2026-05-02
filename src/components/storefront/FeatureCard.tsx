"use client";

import { useState } from "react";
import Image from "next/image";
import { urlFor } from "@/sanity/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/store/cart";
import { formatPKR } from "@/lib/utils";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { CustomizeModal } from "./CustomizeModal";

export type FeaturedItem = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  spiceLevel?: number;
  images?: { asset: { _ref: string } }[];
  tags?: string[];
  category?: { name: string; slug: string };
  variants?: {
    name: string;
    options: { label: string; priceModifier: number }[];
  }[];
};

export function FeatureCard({ item }: { item: FeaturedItem }) {
  const add = useCart((s) => s.addItem);
  const openCart = useCart((s) => s.open);
  const [customizing, setCustomizing] = useState<FeaturedItem | null>(null);

  const img = item.images?.[0]
    ? urlFor(item.images[0]).width(720).height(540).url()
    : null;
  const hasVariants = (item.variants?.length ?? 0) > 0;

  function handleAdd() {
    if (hasVariants) {
      setCustomizing(item);
      return;
    }
    add({
      menuItemId: item._id,
      name: item.name,
      unitPrice: item.price,
      variants: [],
    });
    toast.success(`${item.name} added`);
    openCart();
  }

  return (
    <>
      <article className="group glass rounded-3xl overflow-hidden hover:maroon-glow transition-all duration-500 hover:-translate-y-1 flex flex-col">
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
            <div className="absolute inset-0 grid place-items-center text-6xl">🍜</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-3 left-3 flex gap-1 flex-wrap">
            {item.tags?.includes("signature") && <Badge tone="gold">Signature</Badge>}
            {item.tags?.includes("new") && <Badge tone="neon">New</Badge>}
            {!item.tags?.includes("signature") &&
              !item.tags?.includes("new") &&
              item.category?.name && <Badge tone="cream">{item.category.name}</Badge>}
          </div>
          {item.spiceLevel ? (
            <div className="absolute top-3 right-3">
              <Badge tone="neon">
                {"🌶".repeat(Math.max(1, item.spiceLevel))}
              </Badge>
            </div>
          ) : null}
        </div>
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-display text-xl truncate">{item.name}</h3>
            <span className="gold-text font-semibold whitespace-nowrap">
              {formatPKR(item.price)}
            </span>
          </div>
          {item.description && (
            <p className="mt-2 text-sm text-[var(--mm-cream)]/55 line-clamp-2 flex-1">
              {item.description}
            </p>
          )}
          <div className="mt-4">
            <Button onClick={handleAdd} variant="primary" className="w-full">
              {hasVariants ? (
                "Customize · Add"
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Add to Cart
                </>
              )}
            </Button>
          </div>
        </div>
      </article>

      {customizing && (
        <CustomizeModal item={customizing} onClose={() => setCustomizing(null)} />
      )}
    </>
  );
}
