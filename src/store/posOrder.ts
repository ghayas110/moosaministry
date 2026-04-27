"use client";

import { create } from "zustand";

export type PosLine = {
  lineId: string;
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  variants: { group: string; label: string; priceModifier: number }[];
  notes?: string;
};

type PosState = {
  items: PosLine[];
  orderType: "dine-in" | "pos-takeaway" | "delivery";
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  discount: number;
  taxRate: number;
  add: (line: Omit<PosLine, "lineId" | "quantity"> & { quantity?: number }) => void;
  remove: (lineId: string) => void;
  setQty: (lineId: string, q: number) => void;
  setNotes: (lineId: string, notes: string) => void;
  setType: (t: PosState["orderType"]) => void;
  setTable: (t?: string) => void;
  setCustomer: (name?: string, phone?: string) => void;
  setDiscount: (d: number) => void;
  reset: () => void;
  subtotal: () => number;
  taxAmount: () => number;
  total: () => number;
};

export const usePos = create<PosState>((set, get) => ({
  items: [],
  orderType: "dine-in",
  tableNumber: undefined,
  customerName: undefined,
  customerPhone: undefined,
  discount: 0,
  taxRate: 0,
  add: (input) => {
    const variantsKey = (input.variants ?? [])
      .map((v) => `${v.group}:${v.label}`)
      .sort()
      .join("|");
    const lineId = `${input.menuItemId}::${variantsKey}::${Date.now()}::${Math.random().toString(36).slice(2, 5)}`;
    set({
      items: [
        ...get().items,
        { ...input, lineId, quantity: input.quantity ?? 1 },
      ],
    });
  },
  remove: (lineId) => set({ items: get().items.filter((i) => i.lineId !== lineId) }),
  setQty: (lineId, q) =>
    set({
      items:
        q <= 0
          ? get().items.filter((i) => i.lineId !== lineId)
          : get().items.map((i) => (i.lineId === lineId ? { ...i, quantity: q } : i)),
    }),
  setNotes: (lineId, notes) =>
    set({
      items: get().items.map((i) => (i.lineId === lineId ? { ...i, notes } : i)),
    }),
  setType: (t) => set({ orderType: t, tableNumber: t === "dine-in" ? get().tableNumber : undefined }),
  setTable: (t) => set({ tableNumber: t }),
  setCustomer: (customerName, customerPhone) => set({ customerName, customerPhone }),
  setDiscount: (d) => set({ discount: Math.max(0, d) }),
  reset: () =>
    set({
      items: [],
      tableNumber: undefined,
      customerName: undefined,
      customerPhone: undefined,
      discount: 0,
      orderType: "dine-in",
    }),
  subtotal: () =>
    get().items.reduce(
      (s, i) =>
        s +
        i.quantity *
          (i.unitPrice + i.variants.reduce((m, v) => m + (v.priceModifier ?? 0), 0)),
      0
    ),
  taxAmount: () => Math.round(get().subtotal() * get().taxRate),
  total: () => Math.max(0, get().subtotal() + get().taxAmount() - get().discount),
}));
