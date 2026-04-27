import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { MapPin, Phone } from "lucide-react";
import { InstagramIcon } from "@/components/brand/InstagramIcon"

export function Footer() {
  return (
    <footer className="mt-32 border-t border-[var(--mm-line)] bg-[var(--mm-ink)]/40">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-14 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <Logo size={56} />
            <div>
              <div className="font-display text-lg tracking-[0.2em]">MOOSA · MINISTRY</div>
              <div className="text-xs text-[var(--mm-cream)]/60 mt-1">
                Korean ASMR Cravings — Served Hot.
              </div>
            </div>
          </div>
          <p className="text-sm text-[var(--mm-cream)]/60 max-w-md leading-relaxed">
            Pan-Asian & Korean street food, hand-folded dumplings, sizzling hotpots and
            late-night noodles — straight from Gulshan-e-Maymar, Karachi.
          </p>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] text-[var(--mm-tan)] mb-4">Visit</h4>
          <ul className="space-y-2 text-sm text-[var(--mm-cream)]/70">
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
              Gulshan-e-Maymar, Karachi, Pakistan
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              +92 300 0000000
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] text-[var(--mm-tan)] mb-4">Explore</h4>
          <ul className="space-y-2 text-sm text-[var(--mm-cream)]/70">
            <li><Link href="/menu" className="hover:text-[var(--mm-cream)]">Menu</Link></li>
            <li><Link href="/reservations" className="hover:text-[var(--mm-cream)]">Reservations</Link></li>
            <li><Link href="/gallery" className="hover:text-[var(--mm-cream)]">Gallery</Link></li>
            <li><Link href="/dashboard" className="hover:text-[var(--mm-cream)]">Staff</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[var(--mm-line)] py-6 px-4 md:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between text-xs text-[var(--mm-cream)]/50">
          <span>© {new Date().getFullYear()} Moosa Ministry. All rights reserved.</span>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-[var(--mm-cream)]"
          >
            <InstagramIcon /> Follow
          </a>
        </div>
      </div>
    </footer>
  );
}
