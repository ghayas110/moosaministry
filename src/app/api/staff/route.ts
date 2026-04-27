import { NextResponse } from "next/server";
import { sanityWriteClient } from "@/sanity/client";
import { sanityClient } from "@/sanity/client";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  role: z.enum(["cashier", "manager", "admin", "kitchen"]).default("cashier"),
  pin: z.string().regex(/^\d{4,6}$/),
  isActive: z.boolean().default(true),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const existing = await sanityClient.fetch(
      `*[_type=="staff" && pin == $pin][0]._id`,
      { pin: body.pin }
    );
    if (existing) return NextResponse.json({ error: "PIN already in use" }, { status: 409 });
    const doc = await sanityWriteClient.create({ _type: "staff", ...body });
    return NextResponse.json({ ok: true, id: doc._id });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: "invalid" }, { status: 400 });
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
