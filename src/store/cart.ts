"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartVariant = { group: string; label: string; priceModifier: number };

export type CartItem = {
  lineId: string;
  menuItemId: string;
  name: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
  variants: CartVariant[];
  notes?: string;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, "lineId" | "quantity"> & { quantity?: number }) => void;
  removeItem: (lineId: string) => void;
  updateQty: (lineId: string, qty: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
  subtotal: () => number;
  count: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (input) => {
        const variantsKey = (input.variants ?? [])
          .map((v) => `${v.group}:${v.label}`)
          .sort()
          .join("|");
        const lineId = `${input.menuItemId}::${variantsKey}::${input.notes ?? ""}`;
        const existing = get().items.find((it) => it.lineId === lineId);
        if (existing) {
          set({
            items: get().items.map((it) =>
              it.lineId === lineId
                ? { ...it, quantity: it.quantity + (input.quantity ?? 1) }
                : it
            ),
          });
        } else {
          set({
            items: [
              ...get().items,
              { ...input, lineId, quantity: input.quantity ?? 1 },
            ],
          });
        }
      },
      removeItem: (lineId) =>
        set({ items: get().items.filter((it) => it.lineId !== lineId) }),
      updateQty: (lineId, qty) =>
        set({
          items:
            qty <= 0
              ? get().items.filter((it) => it.lineId !== lineId)
              : get().items.map((it) =>
                  it.lineId === lineId ? { ...it, quantity: qty } : it
                ),
        }),
      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set({ isOpen: !get().isOpen }),
      subtotal: () =>
        get().items.reduce(
          (sum, it) =>
            sum +
            it.quantity *
              (it.unitPrice +
                it.variants.reduce((m, v) => m + (v.priceModifier ?? 0), 0)),
          0
        ),
      count: () => get().items.reduce((n, it) => n + it.quantity, 0),
    }),
    { name: "mm-cart" }
  )
);
