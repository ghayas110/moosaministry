import Link from "next/link";
import { sanityClient } from "@/sanity/client";
import { allCategoriesQuery, menuItemsQuery } from "@/sanity/queries";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen, UtensilsCrossed } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MenuOverviewPage() {
  const [cats, items] = await Promise.all([
    sanityClient.fetch<{ _id: string }[]>(allCategoriesQuery),
    sanityClient.fetch<{ _id: string }[]>(menuItemsQuery),
  ]).catch(() => [[], []]);

  return (
    <div className="p-6 md:p-10 space-y-8">
      <header>
        <span className="text-xs uppercase tracking-[0.4em] text-[var(--mm-tan)]">Menu</span>
        <h1 className="font-display text-4xl mt-2 brand-gradient-text">Menu Builder</h1>
        <p className="mt-2 text-sm text-[var(--mm-cream)]/60 max-w-xl">
          Create the categories that organise your menu, then add the dishes that fill them.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-5">
        <Card
          title="Categories"
          icon={<FolderOpen className="h-5 w-5" />}
          count={cats.length}
          subtitle="Hotpot, Noodles, Dumplings, etc."
          href="/dashboard/menu/categories"
          createHref="/dashboard/menu/categories"
        />
        <Card
          title="Menu Items"
          icon={<UtensilsCrossed className="h-5 w-5" />}
          count={items.length}
          subtitle="Each dish — pricing, photos, recipes."
          href="/dashboard/menu/items"
          createHref="/dashboard/menu/items/new"
        />
      </div>
    </div>
  );
}

function Card({
  title, icon, count, subtitle, href, createHref,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  subtitle: string;
  href: string;
  createHref: string;
}) {
  return (
    <div className="glass rounded-3xl p-6 flex flex-col">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-[0.3em] text-[var(--mm-tan)]">{title}</div>
        {icon}
      </div>
      <div className="font-display text-5xl mt-4">{count}</div>
      <div className="text-sm text-[var(--mm-cream)]/60 mt-1">{subtitle}</div>
      <div className="mt-6 flex gap-2">
        <Button asChild variant="ghost" className="flex-1">
          <Link href={href}>Manage</Link>
        </Button>
        <Button asChild variant="primary" className="flex-1">
          <Link href={createHref}>
            <Plus className="h-4 w-4" /> New
          </Link>
        </Button>
      </div>
    </div>
  );
}
