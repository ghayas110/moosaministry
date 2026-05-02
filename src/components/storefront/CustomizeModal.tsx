"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/store/cart";
import { formatPKR, cn } from "@/lib/utils";
import { toast } from "sonner";

export type CustomizableItem = {
  _id: string;
  name: string;
  price: number;
  variants?: {
    name: string;
    options: { label: string; priceModifier: number }[];
  }[];
};

export function CustomizeModal({
  item,
  onClose,
}: {
  item: CustomizableItem | null;
  onClose: () => void;
}) {
  const add = useCart((s) => s.addItem);
  const openCart = useCart((s) => s.open);
  const [picks, setPicks] = useState<
    Record<string, { label: string; priceModifier: number }>
  >({});
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");

  if (!item) return null;

  const variants = Object.entries(picks).map(([group, v]) => ({
    group,
    label: v.label,
    priceModifier: v.priceModifier,
  }));
  const unitTotal =
    item.price + variants.reduce((s, v) => s + v.priceModifier, 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm grid place-items-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="glass rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-[var(--mm-line)] flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--mm-tan)]">
                Customize
              </span>
              <h3 className="font-display text-2xl mt-1">{item.name}</h3>
            </div>
            <button
              onClick={onClose}
              className="h-9 w-9 grid place-items-center rounded-full hover:bg-[var(--mm-steam)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {item.variants?.map((g) => (
              <div key={g.name}>
                <div className="text-xs uppercase tracking-wider text-[var(--mm-tan)] mb-2">
                  {g.name}
                </div>
                <div className="flex flex-wrap gap-2">
                  {g.options.map((o) => {
                    const sel = picks[g.name]?.label === o.label;
                    return (
                      <button
                        key={o.label}
                        onClick={() => setPicks((p) => ({ ...p, [g.name]: o }))}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm border transition",
                          sel
                            ? "bg-[var(--mm-maroon)] border-[var(--mm-maroon)] text-[var(--mm-cream)]"
                            : "border-[var(--mm-line)] hover:bg-[var(--mm-steam)]"
                        )}
                      >
                        {o.label}
                        {o.priceModifier !== 0 && (
                          <span className="ml-2 text-xs text-[var(--mm-tan)]">
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

            <div>
              <div className="text-xs uppercase tracking-wider text-[var(--mm-tan)] mb-2">
                Notes
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Less spice, no peanuts, etc."
                className="w-full rounded-xl border border-[var(--mm-line)] bg-[var(--mm-ink)]/60 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--mm-maroon)]/60"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="h-10 w-10 rounded-full bg-[var(--mm-steam)] grid place-items-center"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-6 text-center font-semibold">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="h-10 w-10 rounded-full bg-[var(--mm-steam)] grid place-items-center"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="text-right">
                <div className="text-xs text-[var(--mm-cream)]/50">Total</div>
                <div className="gold-text font-semibold text-lg">
                  {formatPKR(unitTotal * qty)}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-[var(--mm-line)]">
            <Button
              variant="neon"
              size="lg"
              className="w-full"
              onClick={() => {
                add({
                  menuItemId: item._id,
                  name: item.name,
                  unitPrice: item.price,
                  variants,
                  quantity: qty,
                  notes: notes || undefined,
                });
                toast.success(`${item.name} added (×${qty})`);
                onClose();
                openCart();
              }}
            >
              Add to Cart · {formatPKR(unitTotal * qty)}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
