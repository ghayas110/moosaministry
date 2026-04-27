import { NextResponse } from "next/server";
import { sanityWriteClient } from "@/sanity/client";
import { z } from "zod";

const schema = z.object({
  orderStatus: z
    .enum(["received", "preparing", "ready", "delivered", "cancelled"])
    .optional(),
  kdsStatus: z.enum(["pending", "in-progress", "completed", "bumped"]).optional(),
  paymentStatus: z.enum(["pending", "paid", "refunded", "void"]).optional(),
  paymentMethod: z.enum(["cash", "card", "cod", "split", "unpaid"]).optional(),
  priority: z.boolean().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const patch = schema.parse(body);

    const sets: Record<string, unknown> = {};
    if (patch.orderStatus) sets.orderStatus = patch.orderStatus;
    if (patch.kdsStatus) sets.kdsStatus = patch.kdsStatus;
    if (patch.paymentStatus) sets.paymentStatus = patch.paymentStatus;
    if (patch.paymentMethod) sets.paymentMethod = patch.paymentMethod;
    if (patch.priority !== undefined) sets.priority = patch.priority;

    if (patch.kdsStatus === "completed" && !patch.orderStatus) {
      sets.orderStatus = "ready";
    }
    if (patch.kdsStatus === "in-progress" && !patch.orderStatus) {
      sets.orderStatus = "preparing";
    }

    const doc = await sanityWriteClient.patch(id).set(sets).commit();
    return NextResponse.json({ ok: true, doc });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", issues: err.issues }, { status: 400 });
    }
    console.error("update order failed", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
