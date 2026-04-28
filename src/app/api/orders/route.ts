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

    // Build the document — Sanity manages _createdAt / _updatedAt / _rev / _id itself,
    // so we MUST NOT set them. Optional fields are only included when they have a value
    // because the Sanity client does not strip `undefined` from object literals.
    const doc: { _type: string; [k: string]: unknown } = {
      _type: "order",
      orderNumber,
      type: parsed.type,
      items: parsed.items.map((it) => ({
        _type: "orderItem",
        _key: `${it.menuItemId.slice(0, 8)}-${Math.random().toString(36).slice(2, 8)}`,
        menuItem: { _type: "reference", _ref: it.menuItemId },
        name: it.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        variants: (it.variants ?? []).map((v, i) => ({
          _key: `v${i}-${Math.random().toString(36).slice(2, 6)}`,
          group: v.group,
          label: v.label,
          priceModifier: v.priceModifier ?? 0,
        })),
        ...(it.notes ? { notes: it.notes } : {}),
        preparedItems: 0,
      })),
      subtotal: parsed.subtotal,
      tax: parsed.tax,
      discount: parsed.discount,
      total: parsed.total,
      paymentMethod: parsed.paymentMethod,
      paymentStatus:
        parsed.paymentStatus ??
        (parsed.paymentMethod === "cash" || parsed.paymentMethod === "card"
          ? "paid"
          : "pending"),
      orderStatus: "received",
      kdsStatus: "pending",
    };

    if (parsed.customerName?.trim()) doc.customerName = parsed.customerName.trim();
    if (parsed.customerPhone?.trim()) doc.customerPhone = parsed.customerPhone.trim();
    if (parsed.deliveryAddress?.trim()) doc.deliveryAddress = parsed.deliveryAddress.trim();
    if (parsed.tableNumber?.trim()) doc.tableNumber = parsed.tableNumber.trim();
    if (parsed.notes?.trim()) doc.notes = parsed.notes.trim();
    if (parsed.staffId)
      doc.staff = { _type: "reference", _ref: parsed.staffId };

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
    const message =
      err instanceof Error ? err.message : "Failed to create order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
