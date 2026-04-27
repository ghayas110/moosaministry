import { NextResponse } from "next/server";
import { sanityWriteClient } from "@/sanity/client";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  category: z.enum(["raw", "packaging", "beverages", "sauces", "other"]).default("raw"),
  unit: z.enum(["kg", "g", "L", "ml", "pieces", "portions", "packs"]),
  currentStock: z.number().nonnegative().default(0),
  restockThreshold: z.number().nonnegative().default(5),
  costPerUnit: z.number().nonnegative().default(0),
  supplierId: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const doc = await sanityWriteClient.create({
      _type: "ingredient",
      name: body.name,
      category: body.category,
      unit: body.unit,
      currentStock: body.currentStock,
      restockThreshold: body.restockThreshold,
      costPerUnit: body.costPerUnit,
      supplier: body.supplierId ? { _type: "reference", _ref: body.supplierId } : undefined,
      notes: body.notes,
    });
    return NextResponse.json({ ok: true, id: doc._id });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: "invalid", issues: err.issues }, { status: 400 });
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
