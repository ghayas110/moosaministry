import { NextResponse } from "next/server";
import { sanityWriteClient } from "@/sanity/client";
import { generateOrderNumber } from "@/lib/utils";
import { deductInventoryForOrder } from "@/lib/inventory";
import { z } from "zod";

const variantSchema = z.object({
  group: z.string(),
  label: z.string(),
  priceModifier: z.number(),
});

const itemSchema = z.object({
  menuItemId: z.string().min(1),
  name: z.string(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().nonnegative(),
  variants: z.array(variantSchema).optional().default([]),
  notes: z.string().optional(),
});

const orderSchema = z.object({
  type: z.enum(["delivery", "takeaway", "dine-in", "pos-takeaway"]),
  items: z.array(itemSchema).min(1),
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative().default(0),
  discount: z.number().nonnegative().default(0),
  total: z.number().nonnegative(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  deliveryAddress: z.string().optional(),
  tableNumber: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(["cash", "card", "cod", "split", "unpaid"]).default("unpaid"),
  paymentStatus: z.enum(["pending", "paid", "refunded", "void"]).optional(),
  staffId: z.string().optional(),
  source: z.enum(["online", "pos"]).default("online"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = orderSchema.parse(body);

    const orderNumber = generateOrderNumber();
    const now = new Date().toISOString();

    const doc = {
      _type: "order",
      orderNumber,
      type: parsed.type,
      items: parsed.items.map((it) => ({
        _type: "orderItem",
        _key: `${it.menuItemId}-${Math.random().toString(36).slice(2, 8)}`,
        menuItem: { _type: "reference", _ref: it.menuItemId },
        name: it.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        variants: (it.variants ?? []).map((v, i) => ({
          _key: `v${i}-${Math.random().toString(36).slice(2, 6)}`,
          ...v,
        })),
        notes: it.notes,
        preparedItems: 0,
      })),
      subtotal: parsed.subtotal,
      tax: parsed.tax,
      discount: parsed.discount,
      total: parsed.total,
      paymentMethod: parsed.paymentMethod,
      paymentStatus: parsed.paymentStatus ?? (parsed.paymentMethod === "cash" || parsed.paymentMethod === "card" ? "paid" : "pending"),
      orderStatus: "received" as const,
      kdsStatus: "pending" as const,
      customerName: parsed.customerName,
      customerPhone: parsed.customerPhone,
      deliveryAddress: parsed.deliveryAddress,
      tableNumber: parsed.tableNumber,
      notes: parsed.notes,
      staff: parsed.staffId ? { _type: "reference", _ref: parsed.staffId } : undefined,
      _createdAt: now,
    };

    const created = await sanityWriteClient.create(doc);

    let inventory: { lowStock: { name: string }[] } = { lowStock: [] };
    try {
      const result = await deductInventoryForOrder({
        orderId: created._id,
        orderNumber,
        items: parsed.items.map((it) => ({
          menuItemId: it.menuItemId,
          name: it.name,
          quantity: it.quantity,
        })),
        performedBy: parsed.staffId ?? "online",
      });
      inventory = { lowStock: result.lowStock };
    } catch (err) {
      console.error("inventory deduction failed", err);
    }

    return NextResponse.json({
      ok: true,
      orderId: created._id,
      orderNumber,
      lowStock: inventory.lowStock,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", issues: err.issues }, { status: 400 });
    }
    console.error("create order failed", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
