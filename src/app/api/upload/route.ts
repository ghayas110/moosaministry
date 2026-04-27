import { NextResponse } from "next/server";
import { sanityWriteClient } from "@/sanity/client";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File))
      return NextResponse.json({ error: "no file" }, { status: 400 });
    const buf = Buffer.from(await file.arrayBuffer());
    const asset = await sanityWriteClient.assets.upload("image", buf, {
      filename: file.name,
      contentType: file.type,
    });
    return NextResponse.json({
      ok: true,
      assetId: asset._id,
      url: asset.url,
    });
  } catch (err) {
    console.error("upload failed", err);
    return NextResponse.json({ error: "upload failed" }, { status: 500 });
  }
}
