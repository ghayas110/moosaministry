import { MapPin, Phone, Clock } from "lucide-react";
import { InstagramIcon } from "@/components/brand/InstagramIcon";

export const metadata = { title: "Contact — Moosa Ministry" };

export default function ContactPage() {
  return (
    <div className="pt-32 pb-24 mx-auto max-w-5xl px-4 md:px-8">
      <header className="text-center mb-12">
        <span className="text-xs uppercase tracking-[0.4em] text-[var(--mm-tan)]">Contact</span>
        <h1 className="font-display text-5xl md:text-7xl mt-4 brand-gradient-text">
          Come find us.
        </h1>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass rounded-3xl p-8 space-y-5">
          <Item icon={<MapPin className="h-5 w-5" />} title="Address">
            Gulshan-e-Maymar, Karachi, Pakistan
          </Item>
          <Item icon={<Phone className="h-5 w-5" />} title="Phone">
            <a href="tel:+923000000000" className="hover:text-[var(--mm-cream)]">
              +92 300 0000000
            </a>
          </Item>
          <Item icon={<Clock className="h-5 w-5" />} title="Hours">
            Mon – Sun · 12:00 PM – 1:00 AM
          </Item>
          <Item icon={<InstagramIcon />} title="Social">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              @moosaministry
            </a>
          </Item>

          <a
            href="https://wa.me/923000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center py-3 rounded-full bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition mt-4"
          >
            💬 WhatsApp Us
          </a>
        </div>

        <div className="glass rounded-3xl overflow-hidden min-h-[360px]">
          <iframe
            title="Map"
            src="https://www.google.com/maps?q=Gulshan-e-Maymar,Karachi&output=embed"
            className="w-full h-full min-h-[360px]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            style={{ filter: "grayscale(0.3) contrast(1.1) brightness(0.9)" }}
          />
        </div>
      </div>
    </div>
  );
}

function Item({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="h-10 w-10 grid place-items-center rounded-full bg-[var(--mm-maroon)]/30 text-[var(--mm-tan)] shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-[var(--mm-tan)]">{title}</div>
        <div className="mt-1 text-[var(--mm-cream)]/80">{children}</div>
      </div>
    </div>
  );
}
