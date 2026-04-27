import { NextResponse } from "next/server";
import { sanityWriteClient } from "@/sanity/client";
import { deleteDoc } from "@/lib/sanityWrite";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).optional(),
  category: z.enum(["raw", "packaging", "beverages", "sauces", "other"]).optional(),
  unit: z.enum(["kg", "g", "L", "ml", "pieces", "portions", "packs"]).optional(),
  currentStock: z.number().nonnegative().optional(),
  restockThreshold: z.number().nonnegative().optional(),
  costPerUnit: z.number().nonnegative().optional(),
  supplierId: z.string().nullable().optional(),
  notes: z.string().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = schema.parse(await req.json());
    const set: Record<string, unknown> = {};
    const unset: string[] = [];
    if (body.name !== undefined) set.name = body.name;
    if (body.category !== undefined) set.category = body.category;
    if (body.unit !== undefined) set.unit = body.unit;
    if (body.currentStock !== undefined) set.currentStock = body.currentStock;
    if (body.restockThreshold !== undefined) set.restockThreshold = body.restockThreshold;
    if (body.costPerUnit !== undefined) set.costPerUnit = body.costPerUnit;
    if (body.notes !== undefined) set.notes = body.notes;
    if (body.supplierId === null) unset.push("supplier");
    else if (body.supplierId)
      set.supplier = { _type: "reference", _ref: body.supplierId };
    await sanityWriteClient.patch(id).set(set).unset(unset).commit();
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: "invalid" }, { status: 400 });
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    await deleteDoc(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
