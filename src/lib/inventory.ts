import { sanityWriteClient } from "@/sanity/client";
import { groq } from "next-sanity";

type RecipeLine = {
  ingredient: { _id: string; name: string; currentStock: number; unit: string };
  quantityPerServing: number;
  unit?: string;
};

const recipeQuery = groq`
  *[_type == "menuItem" && _id == $id][0]{
    "recipe": recipe[]{
      quantityPerServing,
      unit,
      "ingredient": ingredient->{_id, name, currentStock, unit}
    }
  }.recipe
`;

/**
 * Deduct ingredients across all order items based on each menu item's recipe.
 * Writes inventoryLog entries for each consumption.
 */
export async function deductInventoryForOrder(input: {
  orderId: string;
  orderNumber: string;
  items: { menuItemId: string; name: string; quantity: number }[];
  performedBy?: string;
}) {
  const { orderId, orderNumber, items, performedBy } = input;

  const aggregate = new Map<
    string,
    {
      ingredientId: string;
      name: string;
      qty: number;
      unit: string;
      currentStock: number;
    }
  >();

  for (const line of items) {
    const recipe = await sanityWriteClient.fetch<RecipeLine[] | null>(recipeQuery, {
      id: line.menuItemId,
    });
    if (!recipe) continue;
    for (const r of recipe) {
      if (!r.ingredient?._id) continue;
      const totalQty = (r.quantityPerServing ?? 0) * line.quantity;
      if (totalQty <= 0) continue;
      const prev = aggregate.get(r.ingredient._id);
      aggregate.set(r.ingredient._id, {
        ingredientId: r.ingredient._id,
        name: r.ingredient.name,
        qty: (prev?.qty ?? 0) + totalQty,
        unit: r.unit ?? r.ingredient.unit ?? "",
        currentStock: r.ingredient.currentStock ?? 0,
      });
    }
  }

  if (aggregate.size === 0) return { deducted: [], lowStock: [] };

  const deducted: { name: string; qty: number; unit: string }[] = [];
  const lowStock: { name: string; remaining: number; unit: string }[] = [];

  const tx = sanityWriteClient.transaction();
  for (const entry of aggregate.values()) {
    tx.patch(entry.ingredientId, (p) =>
      p.dec({ currentStock: entry.qty }).set({ _updatedAt: new Date().toISOString() })
    );
    tx.create({
      _type: "inventoryLog",
      type: "consumption",
      ingredient: { _type: "reference", _ref: entry.ingredientId },
      quantityChange: -entry.qty,
      reason: `Order ${orderNumber}`,
      orderId,
      performedBy: performedBy ?? "system",
      timestamp: new Date().toISOString(),
    });
    deducted.push({ name: entry.name, qty: entry.qty, unit: entry.unit });
    const remaining = entry.currentStock - entry.qty;
    if (remaining <= 0 || remaining < 5) {
      lowStock.push({ name: entry.name, remaining, unit: entry.unit });
    }
  }
  await tx.commit({ visibility: "async" });

  return { deducted, lowStock };
}
