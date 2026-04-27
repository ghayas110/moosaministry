"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStaffAuth } from "@/store/staffAuth";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import {
  ChefHat,
  Boxes,
  ShoppingCart,
  Tv,
  LogOut,
  LayoutDashboard,
  ScrollText,
  PackagePlus,
  ClipboardList,
  Receipt,
  UtensilsCrossed,
  FolderOpen,
  Armchair,
  Users,
  Truck,
} from "lucide-react";
import { useEffect } from "react";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/pos", label: "POS Terminal", icon: ShoppingCart },
  { href: "/dashboard/kds", label: "Kitchen Display", icon: Tv },
  { href: "/dashboard/orders", label: "Orders", icon: Receipt },

  { section: "Menu" },
  { href: "/dashboard/menu/items", label: "Menu Items", icon: UtensilsCrossed },
  { href: "/dashboard/menu/categories", label: "Categories", icon: FolderOpen },

  { section: "Operations" },
  { href: "/dashboard/tables", label: "Tables", icon: Armchair },
  { href: "/dashboard/staff", label: "Staff", icon: Users },

  { section: "Inventory" },
  { href: "/dashboard/inventory", label: "Stock Health", icon: Boxes },
  { href: "/dashboard/inventory/items", label: "Ingredients", icon: ScrollText },
  { href: "/dashboard/inventory/suppliers", label: "Suppliers", icon: Truck },
  { href: "/dashboard/inventory/recipes", label: "Recipes", icon: ChefHat },
  { href: "/dashboard/inventory/purchase-orders", label: "Purchase Orders", icon: PackagePlus },
  { href: "/dashboard/inventory/reports", label: "Reports & Logs", icon: ClipboardList },
] as Array<
  | { href: string; label: string; icon: React.ComponentType<{ className?: string }> }
  | { section: string }
>;

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const staff = useStaffAuth((s) => s.staff);
  const logout = useStaffAuth((s) => s.logout);

  const isLogin = pathname === "/dashboard/login";

  useEffect(() => {
    if (!staff && !isLogin) {
      router.replace("/dashboard/login");
    }
  }, [staff, isLogin, router]);

  if (isLogin) {
    return <div className="min-h-screen w-full">{children}</div>;
  }

  if (!staff) {
    return (
      <div className="min-h-screen grid place-items-center text-[var(--mm-cream)]/60">
        Redirecting to login…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-72 shrink-0 border-r border-[var(--mm-line)] bg-[var(--mm-ink)]/60 flex flex-col">
        <Link href="/dashboard" className="px-5 py-5 border-b border-[var(--mm-line)] flex items-center gap-3">
          <Logo size={44} />
          <div>
            <div className="font-display tracking-[0.18em] text-sm">MOOSA · MINISTRY</div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--mm-tan)]">
              Operations
            </div>
          </div>
        </Link>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {NAV.map((n, idx) => {
            if ("section" in n) {
              return (
                <div
                  key={`s-${idx}`}
                  className="px-3 pt-5 pb-2 text-[10px] uppercase tracking-[0.3em] text-[var(--mm-tan)]"
                >
                  {n.section}
                </div>
              );
            }
            const active = pathname === n.href;
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition",
                  active
                    ? "bg-[var(--mm-maroon)] text-[var(--mm-cream)]"
                    : "text-[var(--mm-cream)]/65 hover:bg-[var(--mm-steam)]"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[var(--mm-line)]">
          <div className="glass rounded-2xl p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[var(--mm-maroon)] grid place-items-center text-[var(--mm-cream)] font-semibold uppercase">
              {staff.name?.[0] ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{staff.name}</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--mm-tan)]">
                {staff.role}
              </div>
            </div>
            <button
              aria-label="Logout"
              onClick={() => {
                logout();
                router.replace("/dashboard/login");
              }}
              className="h-8 w-8 grid place-items-center rounded-full hover:bg-[var(--mm-steam)]"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
    </div>
  );
}
