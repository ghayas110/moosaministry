import { NextResponse } from "next/server";
import { sanityWriteClient } from "@/sanity/client";
import { z } from "zod";

const variantSchema = z.object({
  name: z.string(),
  options: z.array(
    z.object({ label: z.string(), priceModifier: z.number() })
  ),
});

const recipeLineSchema = z.object({
  ingredientId: z.string(),
  quantityPerServing: z.number().nonnegative(),
  unit: z.string().optional(),
});

const schema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().min(1),
  price: z.number().nonnegative(),
  spiceLevel: z.number().int().min(0).max(5).optional().default(0),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  imageAssetIds: z.array(z.string()).optional(),
  variants: z.array(variantSchema).optional(),
  allergens: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  recipe: z.array(recipeLineSchema).optional(),
});

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function k(prefix: string, i: number) {
  return `${prefix}${i}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const slug = body.slug?.trim() || slugify(body.name);
    const doc = await sanityWriteClient.create({
      _type: "menuItem",
      name: body.name,
      slug: { _type: "slug", current: slug },
      description: body.description,
      category: { _type: "reference", _ref: body.categoryId },
      price: body.price,
      spiceLevel: body.spiceLevel,
      isAvailable: body.isAvailable,
      isFeatured: body.isFeatured,
      images: (body.imageAssetIds ?? []).map((id, i) => ({
        _key: k("img", i),
        _type: "image",
        asset: { _type: "reference", _ref: id },
      })),
      variants: (body.variants ?? []).map((v, i) => ({
        _key: k("v", i),
        _type: "variantGroup",
        name: v.name,
        options: v.options.map((o, j) => ({ _key: k("o", j), ...o })),
      })),
      allergens: body.allergens,
      tags: body.tags,
      recipe: (body.recipe ?? []).map((r, i) => ({
        _key: k("r", i),
        _type: "recipeLine",
        ingredient: { _type: "reference", _ref: r.ingredientId },
        quantityPerServing: r.quantityPerServing,
        unit: r.unit,
      })),
    });
    return NextResponse.json({ ok: true, id: doc._id });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: "invalid", issues: err.issues }, { status: 400 });
    console.error("menu item create failed", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
