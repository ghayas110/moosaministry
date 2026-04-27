import { sanityClient } from "@/sanity/client";
import { groq } from "next-sanity";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const recipesQuery = groq`
  *[_type == "menuItem"] | order(name asc) {
    _id, name, "slug": slug.current, price,
    "recipe": recipe[]{
      quantityPerServing, unit,
      "ingredient": ingredient->{_id, name, unit, currentStock}
    }
  }
`;

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const items = await sanityClient.fetch<{
    _id: string;
    name: string;
    slug: string;
    price: number;
    recipe?: { quantityPerServing: number; unit?: string; ingredient?: { _id: string; name: string; unit: string; currentStock: number } }[];
  }[]>(recipesQuery);

  return (
    <div className="p-6 md:p-10 space-y-6">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <span className="text-xs uppercase tracking-[0.4em] text-[var(--mm-tan)]">Inventory</span>
          <h1 className="font-display text-4xl mt-2 brand-gradient-text">Recipe Engine</h1>
          <p className="mt-2 text-sm text-[var(--mm-cream)]/60 max-w-xl">
            Each menu item maps to ingredients consumed per serving. Confirmed orders auto-deduct stock based on these recipes.
          </p>
        </div>
        <Button asChild variant="outline">
          <a href="/studio/desk/menuItem" target="_blank">Edit recipes in Studio →</a>
        </Button>
      </header>

      <div className="grid md:grid-cols-2 gap-4">
        {items.map((m) => {
          const lines = m.recipe ?? [];
          const empty = lines.length === 0;
          return (
            <div key={m._id} className="glass rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg">{m.name}</h3>
                  <div className="text-xs text-[var(--mm-cream)]/50">PKR {m.price}</div>
                </div>
                {empty ? <Badge tone="warn">No recipe</Badge> : <Badge tone="ok">{lines.length} ingr.</Badge>}
              </div>
              {empty ? (
                <p className="text-xs text-[var(--mm-cream)]/50 mt-3">
                  Add recipe lines in the Studio so stock can deduct on each order.
                </p>
              ) : (
                <ul className="mt-3 space-y-1 text-sm">
                  {lines.map((l, i) => (
                    <li key={i} className="flex justify-between text-[var(--mm-cream)]/80">
                      <span>{l.ingredient?.name ?? "—"}</span>
                      <span className="text-[var(--mm-tan)]">
                        {l.quantityPerServing} {l.unit ?? l.ingredient?.unit ?? ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4">
                <Link
                  href={`/studio/intent/edit/id=${m._id};type=menuItem`}
                  target="_blank"
                  className="text-xs uppercase tracking-wider text-[var(--mm-tan)] hover:text-[var(--mm-cream)]"
                >
                  Edit in Studio →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
