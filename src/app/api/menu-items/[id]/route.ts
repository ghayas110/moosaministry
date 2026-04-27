import { NextResponse } from "next/server";
import { sanityWriteClient } from "@/sanity/client";
import { deleteDoc } from "@/lib/sanityWrite";
import { z } from "zod";

const variantSchema = z.object({
  name: z.string(),
  options: z.array(z.object({ label: z.string(), priceModifier: z.number() })),
});

const schema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  price: z.number().nonnegative().optional(),
  spiceLevel: z.number().int().min(0).max(5).optional(),
  isAvailable: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  imageAssetIds: z.array(z.string()).optional(),
  variants: z.array(variantSchema).optional(),
  allergens: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  recipe: z
    .array(
      z.object({
        ingredientId: z.string(),
        quantityPerServing: z.number().nonnegative(),
        unit: z.string().optional(),
      })
    )
    .optional(),
});

function k(prefix: string, i: number) {
  return `${prefix}${i}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = schema.parse(await req.json());
    const set: Record<string, unknown> = {};
    const unset: string[] = [];

    if (body.name !== undefined) set.name = body.name;
    if (body.slug !== undefined) set.slug = { _type: "slug", current: body.slug };
    if (body.description !== undefined) set.description = body.description;
    if (body.categoryId) set.category = { _type: "reference", _ref: body.categoryId };
    if (body.price !== undefined) set.price = body.price;
    if (body.spiceLevel !== undefined) set.spiceLevel = body.spiceLevel;
    if (body.isAvailable !== undefined) set.isAvailable = body.isAvailable;
    if (body.isFeatured !== undefined) set.isFeatured = body.isFeatured;
    if (body.allergens !== undefined) set.allergens = body.allergens;
    if (body.tags !== undefined) set.tags = body.tags;

    if (body.imageAssetIds !== undefined) {
      set.images = body.imageAssetIds.length
        ? body.imageAssetIds.map((aid, i) => ({
            _key: k("img", i),
            _type: "image",
            asset: { _type: "reference", _ref: aid },
          }))
        : [];
    }

    if (body.variants !== undefined) {
      set.variants = body.variants.map((v, i) => ({
        _key: k("v", i),
        _type: "variantGroup",
        name: v.name,
        options: v.options.map((o, j) => ({ _key: k("o", j), ...o })),
      }));
    }

    if (body.recipe !== undefined) {
      set.recipe = body.recipe.map((r, i) => ({
        _key: k("r", i),
        _type: "recipeLine",
        ingredient: { _type: "reference", _ref: r.ingredientId },
        quantityPerServing: r.quantityPerServing,
        unit: r.unit,
      }));
    }

    await sanityWriteClient
      .patch(id)
      .set(set)
      .unset(unset)
      .commit();
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: "invalid", issues: err.issues }, { status: 400 });
    console.error("menu item patch failed", err);
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
