import { NextResponse } from "next/server";
import { sanityWriteClient } from "@/sanity/client";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const po = await sanityWriteClient.fetch<
    { _id: string; status: string; poNumber: string; items: { ingredient: { _ref: string }; quantity: number }[] } | null
  >(
    `*[_type == "purchaseOrder" && _id == $id][0]{
       _id, status, poNumber,
       items[]{ ingredient, quantity }
     }`,
    { id }
  );
  if (!po) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (po.status === "received")
    return NextResponse.json({ error: "already received" }, { status: 409 });

  const tx = sanityWriteClient.transaction();
  for (const it of po.items ?? []) {
    if (!it.ingredient?._ref || !it.quantity) continue;
    tx.patch(it.ingredient._ref, (p) =>
      p.inc({ currentStock: it.quantity }).set({ lastRestocked: new Date().toISOString() })
    );
    tx.create({
      _type: "inventoryLog",
      type: "restock",
      ingredient: { _type: "reference", _ref: it.ingredient._ref },
      quantityChange: it.quantity,
      reason: `PO ${po.poNumber} received`,
      performedBy: "manager",
      timestamp: new Date().toISOString(),
    });
  }
  tx.patch(po._id, (p) =>
    p.set({ status: "received", receivedAt: new Date().toISOString() })
  );
  await tx.commit();
  return NextResponse.json({ ok: true });
}
