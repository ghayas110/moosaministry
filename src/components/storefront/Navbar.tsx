"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { useCart } from "@/store/cart";
import { ShoppingBag, Menu as MenuIcon, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/menu", label: "Menu" },
  { href: "/about", label: "About" },
  { href: "/gallery", label: "Gallery" },
  { href: "/reservations", label: "Reservations" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const cartCount = useCart((s) => s.count());
  const openCart = useCart((s) => s.open);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-7xl px-4 md:px-8 mt-4">
        <nav className="glass rounded-full px-4 py-2.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Logo size={40} />
            <span className="font-display text-base tracking-[0.2em] text-cream hidden sm:inline">
              MOOSA · MINISTRY
            </span>
          </Link>

          <ul className="hidden md:flex items-center gap-1">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={cn(
                      "px-4 py-2 text-sm rounded-full transition-colors",
                      active
                        ? "text-[var(--mm-cream)] bg-[var(--mm-maroon)]/30"
                        : "text-[var(--mm-cream)]/70 hover:text-[var(--mm-cream)]"
                    )}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            <button
              onClick={openCart}
              aria-label="Open cart"
              className="relative h-10 w-10 grid place-items-center rounded-full hover:bg-[var(--mm-steam)] transition"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[var(--mm-neon)] text-white text-[10px] font-bold grid place-items-center">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden h-10 w-10 grid place-items-center rounded-full hover:bg-[var(--mm-steam)]"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        {mobileOpen && (
          <div className="md:hidden glass mt-2 rounded-2xl p-3 flex flex-col">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 rounded-xl text-sm hover:bg-[var(--mm-steam)]"
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
