import { NextResponse } from "next/server";
import { sanityWriteClient } from "@/sanity/client";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  phone: z.string().min(5),
  date: z.string(),
  time: z.string(),
  party: z.number().int().min(1).max(40),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const r = schema.parse(body);
    await sanityWriteClient.create({
      _type: "order",
      orderNumber: `RSV-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      type: "dine-in",
      orderStatus: "received",
      kdsStatus: "pending",
      paymentStatus: "pending",
      paymentMethod: "unpaid",
      items: [],
      subtotal: 0,
      total: 0,
      tax: 0,
      discount: 0,
      customerName: r.name,
      customerPhone: r.phone,
      tableNumber: `Reservation ${r.party}p`,
      notes: `Reservation for ${r.party} at ${r.date} ${r.time}. ${r.notes ?? ""}`.trim(),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
