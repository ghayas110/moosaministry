"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { sanityClient } from "@/sanity/client";
import { groq } from "next-sanity";
import {
  BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Cell,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { relativeTime } from "@/lib/utils";
import { ArrowRight, Package, AlertTriangle, TrendingDown } from "lucide-react";

const overviewQuery = groq`{
  "totalSku": count(*[_type=="ingredient"]),
  "lowStock": *[_type=="ingredient" && currentStock <= restockThreshold] | order(currentStock asc){
    _id, name, currentStock, restockThreshold, unit
  },
  "outOfStockCount": count(*[_type=="ingredient" && currentStock <= 0]),
  "todayConsumption": math::sum(*[_type=="inventoryLog" && type=="consumption" && timestamp > $startOfDay].quantityChange),
  "stocks": *[_type=="ingredient"] | order(currentStock asc)[0...12]{
    _id, name, currentStock, restockThreshold, unit
  },
  "recentLogs": *[_type=="inventoryLog"] | order(timestamp desc)[0...8]{
    _id, type, quantityChange, reason, timestamp,
    "ingredient": ingredient->{name, unit}
  }
}`;

export default function InventoryDashboard() {
  const [data, setData] = useState<{
    totalSku: number;
    lowStock: { _id: string; name: string; currentStock: number; restockThreshold: number; unit: string }[];
    outOfStockCount: number;
    todayConsumption: number;
    stocks: { _id: string; name: string; currentStock: number; restockThreshold: number; unit: string }[];
    recentLogs: { _id: string; type: string; quantityChange: number; reason: string; timestamp: string; ingredient?: { name: string; unit: string } }[];
  } | null>(null);

  useEffect(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    let cancelled = false;
    async function load() {
      const r = await sanityClient.fetch(overviewQuery, { startOfDay: startOfDay.toISOString() });
      if (!cancelled) setData(r);
    }
    load();
    const sub = sanityClient
      .listen('*[_type in ["ingredient","inventoryLog"]]', {}, { visibility: "query" })
      .subscribe(() => load());
    return () => {
      cancelled = true;
      sub.unsubscribe();
    };
  }, []);

  return (
    <div className="p-6 md:p-10 space-y-8">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <span className="text-xs uppercase tracking-[0.4em] text-[var(--mm-tan)]">Inventory</span>
          <h1 className="font-display text-4xl md:text-5xl mt-2 brand-gradient-text">Stock Health</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/inventory/items">Manage Ingredients <ArrowRight className="h-4 w-4" /></Link>
          </Button>
          <Button asChild variant="primary">
            <Link href="/dashboard/inventory/purchase-orders">Purchase Orders</Link>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi icon={<Package className="h-5 w-5" />} label="Total SKUs" value={data?.totalSku ?? 0} />
        <Kpi
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Low stock"
          value={data?.lowStock.length ?? 0}
          tone={data && data.lowStock.length > 0 ? "warn" : "ok"}
        />
        <Kpi
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Out of stock"
          value={data?.outOfStockCount ?? 0}
          tone={data && data.outOfStockCount > 0 ? "danger" : "ok"}
        />
        <Kpi
          icon={<TrendingDown className="h-5 w-5" />}
          label="Used today"
          value={Math.abs(data?.todayConsumption ?? 0).toFixed(1)}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass rounded-3xl p-6 lg:col-span-2 h-80">
          <div className="text-xs uppercase tracking-[0.3em] text-[var(--mm-tan)]">Stock vs Threshold</div>
          <h3 className="font-display text-xl mb-4">Live Levels</h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={data?.stocks ?? []}>
              <CartesianGrid stroke="rgba(245,240,220,0.06)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(245,240,220,0.4)" fontSize={10} angle={-25} textAnchor="end" height={60} />
              <YAxis stroke="rgba(245,240,220,0.4)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "#14110f",
                  border: "1px solid rgba(245,240,220,0.1)",
                  borderRadius: 12,
                }}
              />
              <Bar dataKey="currentStock" radius={[6, 6, 0, 0]}>
                {(data?.stocks ?? []).map((s, i) => (
                  <Cell
                    key={i}
                    fill={
                      s.currentStock <= 0
                        ? "#FF2D55"
                        : s.currentStock <= s.restockThreshold
                        ? "#FFD700"
                        : "#5C1A2E"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-3xl p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-[var(--mm-tan)]">Watchlist</div>
          <h3 className="font-display text-xl mb-4">Low Stock</h3>
          {data?.lowStock?.length ? (
            <ul className="space-y-3">
              {data.lowStock.map((s) => (
                <li key={s._id} className="flex justify-between text-sm">
                  <span>{s.name}</span>
                  <Badge tone={s.currentStock <= 0 ? "danger" : "warn"}>
                    {s.currentStock} {s.unit}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-[var(--mm-cream)]/50">All stocks healthy.</div>
          )}
        </div>
      </div>

      <div className="glass rounded-3xl p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-[var(--mm-tan)]">Recent</div>
            <h3 className="font-display text-xl">Activity</h3>
          </div>
          <Link href="/dashboard/inventory/reports" className="text-xs uppercase tracking-wider text-[var(--mm-tan)] hover:text-[var(--mm-cream)]">
            All logs →
          </Link>
        </div>
        <ul className="space-y-2 text-sm">
          {data?.recentLogs?.map((l) => (
            <li key={l._id} className="flex justify-between items-center border-b border-[var(--mm-line)] py-2">
              <span>
                <Badge
                  tone={
                    l.type === "consumption" ? "warn" : l.type === "restock" ? "ok" : "cream"
                  }
                  className="mr-2"
                >
                  {l.type}
                </Badge>
                {l.ingredient?.name ?? "—"}{" "}
                <span className="text-[var(--mm-cream)]/40">
                  · {l.quantityChange > 0 ? "+" : ""}
                  {l.quantityChange} {l.ingredient?.unit ?? ""}
                </span>
              </span>
              <span className="text-[var(--mm-cream)]/50 text-xs">{relativeTime(l.timestamp)}</span>
            </li>
          ))}
          {data && data.recentLogs.length === 0 && (
            <li className="text-center py-6 text-[var(--mm-cream)]/50">No activity yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function Kpi({
  icon, label, value, tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  tone?: "default" | "warn" | "danger" | "ok";
}) {
  const c =
    tone === "danger" ? "text-red-300" : tone === "warn" ? "text-amber-300" : tone === "ok" ? "text-emerald-300" : "text-[var(--mm-cream)]";
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between text-[var(--mm-cream)]/60">
        <span className="text-xs uppercase tracking-[0.3em] text-[var(--mm-tan)]">{label}</span>
        {icon}
      </div>
      <div className={`mt-3 font-display text-3xl ${c}`}>{value}</div>
    </div>
  );
}
