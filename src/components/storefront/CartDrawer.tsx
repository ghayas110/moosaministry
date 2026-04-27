"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { formatPKR } from "@/lib/utils";

export function CartDrawer() {
  const { items, isOpen, close, updateQty, removeItem, subtotal } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          onClick={close}
        >
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 240 }}
            className="absolute right-0 top-0 h-full w-full max-w-md bg-[var(--mm-ink)] border-l border-[var(--mm-line)] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-[var(--mm-line)]">
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--mm-tan)]">
                  Receipt
                </div>
                <h2 className="font-display text-2xl">Your Cart</h2>
              </div>
              <button
                onClick={close}
                aria-label="Close cart"
                className="h-10 w-10 grid place-items-center rounded-full hover:bg-[var(--mm-steam)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 grid place-items-center text-center px-6">
                <div>
                  <div className="text-6xl mb-4">🥢</div>
                  <p className="text-[var(--mm-cream)]/60 mb-6">
                    Your bowl is empty. Hand-fold something delicious.
                  </p>
                  <Button asChild onClick={close} variant="neon">
                    <Link href="/menu">Browse Menu</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-3">
                  {items.map((it) => {
                    const lineTotal =
                      (it.unitPrice +
                        it.variants.reduce((m, v) => m + v.priceModifier, 0)) *
                      it.quantity;
                    return (
                      <div
                        key={it.lineId}
                        className="glass rounded-2xl p-4 flex gap-3 items-start"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{it.name}</div>
                          {it.variants.length > 0 && (
                            <div className="text-xs text-[var(--mm-cream)]/50 mt-1">
                              {it.variants.map((v) => v.label).join(" · ")}
                            </div>
                          )}
                          {it.notes && (
                            <div className="text-xs text-[var(--mm-tan)]/80 mt-1 italic">
                              “{it.notes}”
                            </div>
                          )}
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              onClick={() => updateQty(it.lineId, it.quantity - 1)}
                              className="h-8 w-8 grid place-items-center rounded-full bg-[var(--mm-steam)] hover:bg-[var(--mm-line)]"
                              aria-label="Decrease"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center text-sm">{it.quantity}</span>
                            <button
                              onClick={() => updateQty(it.lineId, it.quantity + 1)}
                              className="h-8 w-8 grid place-items-center rounded-full bg-[var(--mm-steam)] hover:bg-[var(--mm-line)]"
                              aria-label="Increase"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => removeItem(it.lineId)}
                              className="ml-auto h-8 w-8 grid place-items-center rounded-full text-red-300 hover:bg-red-900/30"
                              aria-label="Remove"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="text-right text-sm font-semibold text-[var(--mm-cream)]">
                          {formatPKR(lineTotal)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-[var(--mm-line)] p-5 space-y-4">
                  <div className="flex justify-between text-sm text-[var(--mm-cream)]/70">
                    <span>Subtotal</span>
                    <span>{formatPKR(subtotal())}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold">
                    <span>Total</span>
                    <span className="gold-text">{formatPKR(subtotal())}</span>
                  </div>
                  <Button asChild size="lg" variant="neon" className="w-full">
                    <Link href="/checkout" onClick={close}>
                      Proceed to Checkout
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
