import { sanityClient } from "@/sanity/client";
import { groq } from "next-sanity";
import { MenuItemForm, type MenuItemFormInitial } from "@/components/dashboard/MenuItemForm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const itemQuery = groq`*[_type=="menuItem" && _id == $id][0]{
  _id, name, "slug": slug.current, description,
  "categoryId": category->_id,
  price, spiceLevel, isAvailable, isFeatured,
  allergens, tags, images,
  variants[]{ name, options[]{ label, priceModifier } },
  "recipe": recipe[]{
    "ingredientId": ingredient->_id,
    quantityPerServing,
    unit
  }
}`;

export default async function EditMenuItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, categories, ingredients] = await Promise.all([
    sanityClient.fetch<MenuItemFormInitial | null>(itemQuery, { id }),
    sanityClient.fetch<{ _id: string; name: string }[]>(
      groq`*[_type=="category"] | order(displayOrder asc){_id, name}`
    ),
    sanityClient.fetch<{ _id: string; name: string; unit: string }[]>(
      groq`*[_type=="ingredient"] | order(name asc){_id, name, unit}`
    ),
  ]);

  if (!item) notFound();

  return <MenuItemForm initial={item} categories={categories} ingredients={ingredients} />;
}
