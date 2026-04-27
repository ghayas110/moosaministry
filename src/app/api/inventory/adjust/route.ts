import { NextResponse } from "next/server";
import { sanityWriteClient } from "@/sanity/client";
import { z } from "zod";

const schema = z.object({
  ingredientId: z.string(),
  change: z.number(),
  type: z.enum(["waste", "adjustment"]).default("adjustment"),
  reason: z.string().optional(),
  performedBy: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const tx = sanityWriteClient.transaction();
    if (body.change !== 0) {
      tx.patch(body.ingredientId, (p) =>
        body.change > 0
          ? p.inc({ currentStock: body.change })
          : p.dec({ currentStock: Math.abs(body.change) })
      );
    }
    tx.create({
      _type: "inventoryLog",
      type: body.type,
      ingredient: { _type: "reference", _ref: body.ingredientId },
      quantityChange: body.change,
      reason: body.reason,
      performedBy: body.performedBy ?? "manager",
      timestamp: new Date().toISOString(),
    });
    await tx.commit();
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: "invalid" }, { status: 400 });
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
