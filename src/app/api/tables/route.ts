import { NextResponse } from "next/server";
import { sanityWriteClient } from "@/sanity/client";
import { z } from "zod";

const schema = z.object({
  tableNumber: z.string().min(1),
  section: z.enum(["main", "patio", "private", "bar"]).default("main"),
  capacity: z.number().int().min(1).default(4),
  isOccupied: z.boolean().default(false),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const doc = await sanityWriteClient.create({ _type: "table", ...body });
    return NextResponse.json({ ok: true, id: doc._id });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: "invalid" }, { status: 400 });
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
