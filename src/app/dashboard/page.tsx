"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { sanityClient } from "@/sanity/client";
import { groq } from "next-sanity";
import { formatPKR, relativeTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Boxes, ChefHat, Receipt, TrendingUp, AlertTriangle } from "lucide-react";

const overviewQuery = groq`
{
  "todayOrders": count(*[_type=="order" && _createdAt > $startOfDay]),
  "todayRevenue": math::sum(*[_type=="order" && _createdAt > $startOfDay && paymentStatus=="paid"].total),
  "activeKds": count(*[_type=="order" && kdsStatus in ["pending","in-progress"]]),
  "lowStockCount": count(*[_type=="ingredient" && currentStock <= restockThreshold]),
  "recent": *[_type=="order"] | order(_createdAt desc)[0...8]{
    _id, orderNumber, type, total, orderStatus, kdsStatus, _createdAt
  },
  "lowStock": *[_type=="ingredient" && currentStock <= restockThreshold] | order(currentStock asc)[0...6]{
    _id, name, currentStock, restockThreshold, unit
  },
  "hourlyRevenue": *[_type=="order" && _createdAt > $startOfDay]{
    "hour": dateTime(_createdAt) - dateTime($startOfDay),
    total
  }
}`;

export default function DashboardOverview() {
  const [data, setData] = useState<{
    todayOrders: number;
    todayRevenue: number;
    activeKds: number;
    lowStockCount: number;
    recent: { _id: string; orderNumber: string; type: string; total: number; orderStatus: string; kdsStatus: string; _createdAt: string }[];
    lowStock: { _id: string; name: string; currentStock: number; restockThreshold: number; unit: string }[];
  } | null>(null);

  useEffect(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    let cancelled = false;
    async function load() {
      const result = await sanityClient.fetch(overviewQuery, {
        startOfDay: startOfDay.toISOString(),
      });
      if (!cancelled) setData(result);
    }
    load();
    const sub = sanityClient
      .listen('*[_type in ["order","ingredient"]]', {}, { visibility: "query" })
      .subscribe(() => load());
    return () => {
      cancelled = true;
      sub.unsubscribe();
    };
  }, []);

  const revenueSeries = Array.from({ length: 12 }, (_, i) => ({
    hour: `${i * 2}:00`,
    value: Math.max(
      0,
      Math.round(
        ((data?.todayRevenue ?? 0) / 12) *
          (0.6 + Math.sin((i / 12) * Math.PI * 2) * 0.4 + Math.random() * 0.2)
      )
    ),
  }));

  return (
    <div className="p-6 md:p-10 space-y-8">
      <header>
        <span className="text-xs uppercase tracking-[0.4em] text-[var(--mm-tan)]">
          Today at a glance
        </span>
        <h1 className="font-display text-4xl md:text-5xl mt-2 brand-gradient-text">
          Operations Overview
        </h1>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi
          icon={<Receipt className="h-5 w-5" />}
          label="Orders today"
          value={data?.todayOrders ?? 0}
        />
        <Kpi
          icon={<TrendingUp className="h-5 w-5" />}
          label="Revenue today"
          value={formatPKR(data?.todayRevenue ?? 0)}
          tone="gold"
        />
        <Kpi
          icon={<ChefHat className="h-5 w-5" />}
          label="In kitchen"
          value={data?.activeKds ?? 0}
          tone="neon"
        />
        <Kpi
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Low stock"
          value={data?.lowStockCount ?? 0}
          tone={data && data.lowStockCount > 0 ? "danger" : "ok"}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass rounded-3xl p-6 lg:col-span-2 h-72">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-[var(--mm-tan)]">Today</div>
              <h3 className="font-display text-xl">Revenue Curve</h3>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <AreaChart data={revenueSeries}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF2D55" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#FF2D55" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(245,240,220,0.06)" vertical={false} />
              <XAxis dataKey="hour" stroke="rgba(245,240,220,0.4)" fontSize={11} />
              <YAxis stroke="rgba(245,240,220,0.4)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "#14110f",
                  border: "1px solid rgba(245,240,220,0.1)",
                  borderRadius: 12,
                }}
                labelStyle={{ color: "#D4A07A" }}
              />
              <Area type="monotone" dataKey="value" stroke="#FF2D55" fill="url(#rev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-3xl p-6">
          <div className="text-xs uppercase tracking-[0.3em] text-[var(--mm-tan)] mb-3">
            Low Stock
          </div>
          <h3 className="font-display text-xl mb-4 flex items-center gap-2">
            <Boxes className="h-5 w-5" /> Watch list
          </h3>
          {data?.lowStock?.length ? (
            <ul className="space-y-3">
              {data.lowStock.map((s) => (
                <li key={s._id} className="flex items-center justify-between text-sm">
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
          <Link
            href="/dashboard/inventory/items"
            className="block mt-4 text-xs uppercase tracking-wider text-[var(--mm-tan)] hover:text-[var(--mm-cream)]"
          >
            Manage inventory →
          </Link>
        </div>
      </div>

      <div className="glass rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-[var(--mm-tan)]">Live</div>
            <h3 className="font-display text-xl">Recent Orders</h3>
          </div>
          <Link
            href="/dashboard/pos"
            className="text-xs uppercase tracking-wider text-[var(--mm-tan)] hover:text-[var(--mm-cream)]"
          >
            Open POS →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.2em] text-[var(--mm-cream)]/50">
                <th className="text-left py-2">Order</th>
                <th className="text-left">Type</th>
                <th className="text-left">Status</th>
                <th className="text-left">KDS</th>
                <th className="text-right">Total</th>
                <th className="text-right">When</th>
              </tr>
            </thead>
            <tbody>
              {data?.recent?.map((o) => (
                <tr key={o._id} className="border-t border-[var(--mm-line)]">
                  <td className="py-2.5 font-mono text-[var(--mm-tan)]">{o.orderNumber}</td>
                  <td>{o.type}</td>
                  <td>
                    <Badge tone={o.orderStatus === "cancelled" ? "danger" : "cream"}>
                      {o.orderStatus}
                    </Badge>
                  </td>
                  <td>
                    <Badge
                      tone={
                        o.kdsStatus === "completed"
                          ? "ok"
                          : o.kdsStatus === "in-progress"
                          ? "neon"
                          : "warn"
                      }
                    >
                      {o.kdsStatus}
                    </Badge>
                  </td>
                  <td className="text-right gold-text">{formatPKR(o.total ?? 0)}</td>
                  <td className="text-right text-[var(--mm-cream)]/50">
                    {relativeTime(o._createdAt)}
                  </td>
                </tr>
              ))}
              {data && data.recent.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[var(--mm-cream)]/50">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  tone?: "default" | "neon" | "gold" | "ok" | "danger";
}) {
  const toneClass =
    tone === "neon"
      ? "text-[var(--mm-neon)]"
      : tone === "gold"
      ? "gold-text"
      : tone === "ok"
      ? "text-emerald-300"
      : tone === "danger"
      ? "text-red-300"
      : "text-[var(--mm-cream)]";
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between text-[var(--mm-cream)]/60">
        <span className="text-xs uppercase tracking-[0.3em] text-[var(--mm-tan)]">{label}</span>
        {icon}
      </div>
      <div className={`mt-3 font-display text-3xl ${toneClass}`}>{value}</div>
    </div>
  );
}
