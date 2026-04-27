import { NextResponse } from "next/server";
import { sanityWriteClient } from "@/sanity/client";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  icon: z.string().optional(),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const slug = body.slug?.trim() || slugify(body.name);
    const doc = await sanityWriteClient.create({
      _type: "category",
      name: body.name,
      slug: { _type: "slug", current: slug },
      icon: body.icon,
      displayOrder: body.displayOrder,
      isActive: body.isActive,
    });
    return NextResponse.json({ ok: true, id: doc._id });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: "invalid", issues: err.issues }, { status: 400 });
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
