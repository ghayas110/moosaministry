import { sanityClient } from "@/sanity/client";
import { allCategoriesQuery, menuItemsQuery } from "@/sanity/queries";
import {
  MenuExplorer,
  type MenuCategory,
  type MenuItem,
} from "@/components/storefront/MenuExplorer";

export const revalidate = 30;
export const metadata = { title: "Menu — Moosa Ministry" };

export default async function MenuPage() {
  let categories: MenuCategory[] = [];
  let items: MenuItem[] = [];
  try {
    [categories, items] = await Promise.all([
      sanityClient.fetch<MenuCategory[]>(allCategoriesQuery),
      sanityClient.fetch<MenuItem[]>(menuItemsQuery),
    ]);
  } catch (err) {
    console.error("menu fetch failed", err);
  }
  return <MenuExplorer categories={categories} items={items} />;
}
