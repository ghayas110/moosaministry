import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteDoc, patchDoc } from "@/lib/sanityWrite";

const schema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  icon: z.string().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = schema.parse(await req.json());
    const set: Record<string, unknown> = { ...body };
    if (body.slug) set.slug = { _type: "slug", current: body.slug };
    await patchDoc(id, set);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: "invalid" }, { status: 400 });
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
