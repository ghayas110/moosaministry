import { NextResponse } from "next/server";
import { sanityClient } from "@/sanity/client";
import { staffByPinQuery } from "@/sanity/queries";
import { z } from "zod";

const schema = z.object({ pin: z.string().regex(/^\d{4,6}$/) });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pin } = schema.parse(body);
    const staff = await sanityClient.fetch<
      { _id: string; name: string; role: string } | null
    >(staffByPinQuery, { pin });
    if (!staff) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
    }
    return NextResponse.json({
      ok: true,
      staff: { id: staff._id, name: staff.name, role: staff.role },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "PIN must be 4–6 digits" }, { status: 400 });
    }
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
