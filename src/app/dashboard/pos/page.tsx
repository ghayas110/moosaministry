import { sanityClient } from "@/sanity/client";
import { allCategoriesQuery, menuItemsQuery, tablesQuery } from "@/sanity/queries";
import { POSTerminal } from "@/components/dashboard/POSTerminal";

export const dynamic = "force-dynamic";

export default async function POSPage() {
  const [categories, items, tables] = await Promise.all([
    sanityClient.fetch(allCategoriesQuery),
    sanityClient.fetch(menuItemsQuery),
    sanityClient.fetch(tablesQuery),
  ]).catch(() => [[], [], []]);

  return <POSTerminal categories={categories} items={items} tables={tables} />;
}
