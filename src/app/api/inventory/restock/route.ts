import { NextResponse } from "next/server";
import { sanityWriteClient } from "@/sanity/client";
import { z } from "zod";

const schema = z.object({
  ingredientId: z.string().min(1),
  quantity: z.number().positive(),
  reason: z.string().optional(),
  performedBy: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const { ingredientId, quantity, reason, performedBy } = schema.parse(await req.json());
    const tx = sanityWriteClient.transaction();
    tx.patch(ingredientId, (p) =>
      p.inc({ currentStock: quantity }).set({ lastRestocked: new Date().toISOString() })
    );
    tx.create({
      _type: "inventoryLog",
      type: "restock",
      ingredient: { _type: "reference", _ref: ingredientId },
      quantityChange: quantity,
      reason: reason ?? "Manual restock",
      performedBy: performedBy ?? "manager",
      timestamp: new Date().toISOString(),
    });
    await tx.commit();
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: "invalid" }, { status: 400 });
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
