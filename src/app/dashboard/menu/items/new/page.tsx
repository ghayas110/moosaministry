import { sanityClient } from "@/sanity/client";
import { groq } from "next-sanity";
import { MenuItemForm } from "@/components/dashboard/MenuItemForm";

export const dynamic = "force-dynamic";

export default async function NewMenuItemPage() {
  const [categories, ingredients] = await Promise.all([
    sanityClient.fetch<{ _id: string; name: string }[]>(
      groq`*[_type=="category"] | order(displayOrder asc){_id, name}`
    ),
    sanityClient.fetch<{ _id: string; name: string; unit: string }[]>(
      groq`*[_type=="ingredient"] | order(name asc){_id, name, unit}`
    ),
  ]).catch(() => [[], []]);

  return <MenuItemForm categories={categories} ingredients={ingredients} />;
}
