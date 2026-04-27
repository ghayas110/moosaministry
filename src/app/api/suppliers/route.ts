import { NextResponse } from "next/server";
import { sanityWriteClient } from "@/sanity/client";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const doc = await sanityWriteClient.create({
      _type: "supplier",
      ...body,
      email: body.email || undefined,
    });
    return NextResponse.json({ ok: true, id: doc._id });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: "invalid", issues: err.issues }, { status: 400 });
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
