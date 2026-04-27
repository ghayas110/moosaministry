"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Select, TextArea, Toggle } from "@/components/dashboard/Field";
import { toast } from "sonner";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { urlFor } from "@/sanity/client";
import { cn, formatPKR } from "@/lib/utils";

type Category = { _id: string; name: string };
type Ingredient = { _id: string; name: string; unit: string };

type ImageRef = { assetId: string; url: string };

type VariantGroup = {
  name: string;
  options: { label: string; priceModifier: number }[];
};

type RecipeLine = { ingredientId: string; quantityPerServing: number; unit?: string };

export type MenuItemFormInitial = {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  categoryId?: string;
  price: number;
  spiceLevel?: number;
  isAvailable?: boolean;
  isFeatured?: boolean;
  allergens?: string[];
  tags?: string[];
  images?: { _key?: string; asset?: { _ref?: string; url?: string } }[];
  variants?: VariantGroup[];
  recipe?: { ingredientId: string; quantityPerServing: number; unit?: string }[];
};

const ALLERGENS = ["gluten", "dairy", "egg", "peanut", "tree-nut", "soy", "shellfish", "fish", "sesame"];
const TAGS = ["halal", "vegan", "vegetarian", "spicy", "signature", "new"];

export function MenuItemForm({
  initial,
  categories,
  ingredients,
}: {
  initial?: MenuItemFormInitial;
  categories: Category[];
  ingredients: Ingredient[];
}) {
  const router = useRouter();

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?._id ?? "");
  const [price, setPrice] = useState(initial?.price ?? 0);
  const [spiceLevel, setSpiceLevel] = useState(initial?.spiceLevel ?? 0);
  const [isAvailable, setIsAvailable] = useState(initial?.isAvailable ?? true);
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);
  const [allergens, setAllergens] = useState<string[]>(initial?.allergens ?? []);
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [variants, setVariants] = useState<VariantGroup[]>(initial?.variants ?? []);
  const [recipe, setRecipe] = useState<RecipeLine[]>(
    initial?.recipe?.map((r) => ({
      ingredientId: r.ingredientId,
      quantityPerServing: r.quantityPerServing,
      unit: r.unit,
    })) ?? []
  );
  const [images, setImages] = useState<ImageRef[]>(
    (initial?.images ?? [])
      .map((img) => {
        const ref = img.asset?._ref;
        if (!ref) return null;
        return {
          assetId: ref,
          url: urlFor({ asset: { _ref: ref } }).width(400).url(),
        };
      })
      .filter((x): x is ImageRef => !!x)
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  function toggleArr<T extends string>(arr: T[], v: T): T[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) throw new Error("upload failed");
        const data: { assetId: string; url: string } = await res.json();
        setImages((arr) => [...arr, data]);
      }
      toast.success("Uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function save() {
    if (!name.trim()) return toast.error("Name required");
    if (!categoryId) return toast.error("Pick a category");
    if (price < 0) return toast.error("Invalid price");

    setSaving(true);
    try {
      const payload = {
        name,
        slug: slug || undefined,
        description: description || undefined,
        categoryId,
        price: Number(price),
        spiceLevel: Number(spiceLevel),
        isAvailable,
        isFeatured,
        allergens,
        tags,
        imageAssetIds: images.map((i) => i.assetId),
        variants: variants.map((v) => ({
          name: v.name,
          options: v.options.map((o) => ({
            label: o.label,
            priceModifier: Number(o.priceModifier) || 0,
          })),
        })),
        recipe: recipe
          .filter((r) => r.ingredientId && r.quantityPerServing > 0)
          .map((r) => ({
            ingredientId: r.ingredientId,
            quantityPerServing: Number(r.quantityPerServing),
            unit: r.unit,
          })),
      };

      const url = initial ? `/api/menu-items/${initial._id}` : "/api/menu-items";
      const method = initial ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "save failed");
      }
      toast.success(initial ? "Saved" : "Created");
      router.push("/dashboard/menu/items");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl space-y-6">
      <header>
        <span className="text-xs uppercase tracking-[0.4em] text-[var(--mm-tan)]">Menu</span>
        <h1 className="font-display text-4xl mt-2 brand-gradient-text">
          {initial ? `Edit · ${initial.name}` : "New Menu Item"}
        </h1>
      </header>

      <section className="glass rounded-3xl p-6 space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Slug" hint="auto from name">
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="spicy-beef-hotpot" />
          </Field>
        </div>
        <Field label="Description">
          <TextArea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </Field>
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Category">
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Price (PKR)">
            <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          </Field>
          <Field label="Spice Level (0–5)">
            <Input
              type="number"
              min={0}
              max={5}
              value={spiceLevel}
              onChange={(e) => setSpiceLevel(Math.max(0, Math.min(5, Number(e.target.value) || 0)))}
            />
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          <Toggle checked={isAvailable} onChange={setIsAvailable} label="Available on menu" />
          <Toggle checked={isFeatured} onChange={setIsFeatured} label="Featured on home" />
        </div>
      </section>

      {/* Images */}
      <section className="glass rounded-3xl p-6 space-y-4">
        <h3 className="font-display text-xl">Photos</h3>
        <div className="flex flex-wrap gap-3">
          {images.map((img) => (
            <div key={img.assetId} className="relative h-28 w-28 rounded-xl overflow-hidden border border-[var(--mm-line)]">
              <Image src={img.url} alt="" fill className="object-cover" sizes="112px" />
              <button
                onClick={() => setImages((arr) => arr.filter((i) => i.assetId !== img.assetId))}
                className="absolute top-1 right-1 h-6 w-6 grid place-items-center rounded-full bg-black/60 text-white"
                aria-label="Remove"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <label className={cn(
            "h-28 w-28 rounded-xl border-2 border-dashed border-[var(--mm-line)] grid place-items-center cursor-pointer hover:bg-[var(--mm-steam)] transition text-center text-xs text-[var(--mm-cream)]/60",
            uploading && "opacity-60 pointer-events-none"
          )}>
            <div>
              <Upload className="h-5 w-5 mx-auto mb-1" />
              {uploading ? "Uploading…" : "Upload"}
            </div>
            <input type="file" multiple accept="image/*" className="hidden" onChange={onUpload} />
          </label>
        </div>
      </section>

      {/* Tags + Allergens */}
      <section className="glass rounded-3xl p-6 grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-display text-xl mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTags((a) => toggleArr(a, t))}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs border transition",
                  tags.includes(t)
                    ? "bg-[var(--mm-maroon)] border-[var(--mm-maroon)] text-[var(--mm-cream)]"
                    : "border-[var(--mm-line)]"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-display text-xl mb-3">Allergens</h3>
          <div className="flex flex-wrap gap-2">
            {ALLERGENS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setAllergens((a) => toggleArr(a, t))}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs border transition",
                  allergens.includes(t)
                    ? "bg-[var(--mm-maroon)] border-[var(--mm-maroon)] text-[var(--mm-cream)]"
                    : "border-[var(--mm-line)]"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Variants */}
      <section className="glass rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl">Variants</h3>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setVariants((arr) => [...arr, { name: "Spice Level", options: [{ label: "Mild", priceModifier: 0 }] }])}
          >
            <Plus className="h-3.5 w-3.5" /> Add Group
          </Button>
        </div>
        {variants.length === 0 && (
          <p className="text-sm text-[var(--mm-cream)]/50">
            E.g. Spice Level (Mild / Medium / Hot) · Protein (Beef / Chicken / Tofu).
          </p>
        )}
        {variants.map((v, gi) => (
          <div key={gi} className="border border-[var(--mm-line)] rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Input
                value={v.name}
                onChange={(e) => setVariants((arr) => arr.map((g, i) => (i === gi ? { ...g, name: e.target.value } : g)))}
                placeholder="Group name (e.g. Protein)"
                className="flex-1"
              />
              <Button type="button" size="sm" variant="ghost" onClick={() => setVariants((arr) => arr.filter((_, i) => i !== gi))}>
                <Trash2 className="h-3.5 w-3.5 text-red-300" />
              </Button>
            </div>
            {v.options.map((o, oi) => (
              <div key={oi} className="grid grid-cols-12 gap-2 items-center">
                <Input
                  className="col-span-7"
                  value={o.label}
                  onChange={(e) =>
                    setVariants((arr) =>
                      arr.map((g, i) =>
                        i === gi
                          ? {
                              ...g,
                              options: g.options.map((op, j) => (j === oi ? { ...op, label: e.target.value } : op)),
                            }
                          : g
                      )
                    )
                  }
                  placeholder="Label"
                />
                <Input
                  className="col-span-4"
                  type="number"
                  value={o.priceModifier}
                  onChange={(e) =>
                    setVariants((arr) =>
                      arr.map((g, i) =>
                        i === gi
                          ? {
                              ...g,
                              options: g.options.map((op, j) => (j === oi ? { ...op, priceModifier: Number(e.target.value) || 0 } : op)),
                            }
                          : g
                      )
                    )
                  }
                  placeholder="Δ price"
                />
                <button
                  type="button"
                  onClick={() =>
                    setVariants((arr) =>
                      arr.map((g, i) => (i === gi ? { ...g, options: g.options.filter((_, j) => j !== oi) } : g))
                    )
                  }
                  className="col-span-1 text-red-300 hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() =>
                setVariants((arr) =>
                  arr.map((g, i) =>
                    i === gi ? { ...g, options: [...g.options, { label: "", priceModifier: 0 }] } : g
                  )
                )
              }
            >
              + Option
            </Button>
            <p className="text-xs text-[var(--mm-cream)]/40">
              Price preview: {formatPKR(price + (v.options[0]?.priceModifier ?? 0))} for first option.
            </p>
          </div>
        ))}
      </section>

      {/* Recipe */}
      <section className="glass rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-xl">Recipe</h3>
            <p className="text-xs text-[var(--mm-cream)]/50 mt-1">
              Ingredients deducted from inventory each time this dish is ordered.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={ingredients.length === 0}
            onClick={() =>
              setRecipe((arr) => [...arr, { ingredientId: ingredients[0]?._id ?? "", quantityPerServing: 0, unit: ingredients[0]?.unit ?? "" }])
            }
          >
            <Plus className="h-3.5 w-3.5" /> Add ingredient
          </Button>
        </div>
        {ingredients.length === 0 && (
          <p className="text-sm text-amber-300">
            Add ingredients first under Inventory → Ingredients to wire up recipes.
          </p>
        )}
        {recipe.map((r, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 items-center">
            <Select
              className="col-span-6 h-10"
              value={r.ingredientId}
              onChange={(e) => {
                const ing = ingredients.find((i) => i._id === e.target.value);
                setRecipe((arr) =>
                  arr.map((x, i) => (i === idx ? { ...x, ingredientId: e.target.value, unit: ing?.unit ?? x.unit } : x))
                );
              }}
            >
              {ingredients.map((i) => (
                <option key={i._id} value={i._id}>{i.name} ({i.unit})</option>
              ))}
            </Select>
            <Input
              className="col-span-3 h-10"
              type="number"
              step="0.01"
              value={r.quantityPerServing}
              onChange={(e) =>
                setRecipe((arr) => arr.map((x, i) => (i === idx ? { ...x, quantityPerServing: Number(e.target.value) || 0 } : x)))
              }
              placeholder="Qty / serving"
            />
            <Input
              className="col-span-2 h-10"
              value={r.unit ?? ""}
              onChange={(e) => setRecipe((arr) => arr.map((x, i) => (i === idx ? { ...x, unit: e.target.value } : x)))}
              placeholder="unit"
            />
            <button
              type="button"
              onClick={() => setRecipe((arr) => arr.filter((_, i) => i !== idx))}
              className="col-span-1 text-red-300 hover:text-red-400"
            >
              ✕
            </button>
          </div>
        ))}
      </section>

      <div className="flex justify-end gap-3 sticky bottom-0 py-4 bg-gradient-to-t from-[var(--mm-black)] to-transparent">
        <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
        <Button variant="neon" onClick={save} disabled={saving}>
          {saving ? "Saving…" : initial ? "Save Changes" : "Create Item"}
        </Button>
      </div>
    </div>
  );
}
