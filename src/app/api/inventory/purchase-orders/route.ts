import { NextResponse } from "next/server";
import { sanityWriteClient } from "@/sanity/client";
import { z } from "zod";

const schema = z.object({
  supplierId: z.string(),
  items: z
    .array(
      z.object({
        ingredientId: z.string(),
        quantity: z.number().positive(),
        unitCost: z.number().nonnegative(),
      })
    )
    .min(1),
  expectedDelivery: z.string().optional(),
  createdBy: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const totalCost = body.items.reduce((s, i) => s + i.quantity * i.unitCost, 0);
    const poNumber = `PO-${Date.now().toString(36).toUpperCase().slice(-6)}`;

    const doc = await sanityWriteClient.create({
      _type: "purchaseOrder",
      poNumber,
      supplier: { _type: "reference", _ref: body.supplierId },
      items: body.items.map((i, idx) => ({
        _key: `i${idx}`,
        ingredient: { _type: "reference", _ref: i.ingredientId },
        quantity: i.quantity,
        unitCost: i.unitCost,
      })),
      totalCost,
      status: "pending",
      expectedDelivery: body.expectedDelivery,
      createdBy: body.createdBy,
      notes: body.notes,
    });
    return NextResponse.json({ ok: true, id: doc._id, poNumber });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: "invalid", issues: err.issues }, { status: 400 });
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
