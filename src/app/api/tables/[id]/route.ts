import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteDoc, patchDoc } from "@/lib/sanityWrite";

const schema = z.object({
  tableNumber: z.string().min(1).optional(),
  section: z.enum(["main", "patio", "private", "bar"]).optional(),
  capacity: z.number().int().min(1).optional(),
  isOccupied: z.boolean().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = schema.parse(await req.json());
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
