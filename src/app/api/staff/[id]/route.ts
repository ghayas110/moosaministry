import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteDoc, patchDoc } from "@/lib/sanityWrite";
import { sanityClient } from "@/sanity/client";

const schema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["cashier", "manager", "admin", "kitchen"]).optional(),
  pin: z.string().regex(/^\d{4,6}$/).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = schema.parse(await req.json());
    if (body.pin) {
      const conflict = await sanityClient.fetch(
        `*[_type=="staff" && pin == $pin && _id != $id][0]._id`,
        { pin: body.pin, id }
      );
      if (conflict) return NextResponse.json({ error: "PIN already in use" }, { status: 409 });
    }
    await patchDoc(id, body as Record<string, unknown>);
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
