import { Hero3D } from "@/components/storefront/Hero3D";
import { ZoomGallery } from "@/components/storefront/ZoomGallery";
import { FeatureCard, type FeaturedItem } from "@/components/storefront/FeatureCard";
import { sanityClient } from "@/sanity/client";
import { featuredItemsQuery } from "@/sanity/queries";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Flame, Clock, MapPin, Sparkles } from "lucide-react";

export const revalidate = 60;

export default async function HomePage() {
  let featured: FeaturedItem[] = [];
  try {
    featured = await sanityClient.fetch<FeaturedItem[]>(featuredItemsQuery);
  } catch {
    featured = [];
  }

  return (
    <>
      <Hero3D />

      {/* Marquee strip */}
      <div className="overflow-hidden border-y border-[var(--mm-line)] bg-[var(--mm-ink)]/40 py-4">
        <div className="flex gap-12 animate-[marquee_40s_linear_infinite] whitespace-nowrap font-display text-2xl text-[var(--mm-tan)]/40">
          {[
            "🥢 ASMR Noodles",
            "🍜 Live Hotpot",
            "🥟 Hand-folded Dumplings",
            "🌶 Korean Heat",
            "🍙 Gimbap Rolls",
            "🍗 Crispy Korean Fried Chicken",
            "🥢 ASMR Noodles",
            "🍜 Live Hotpot",
            "🥟 Hand-folded Dumplings",
          ].map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </div>
        <style>{`@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
      </div>

      {/* Gallery Section */}
      <ZoomGallery />

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 md:px-8 py-24">
        <div className="flex items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs uppercase tracking-[0.4em] text-[var(--mm-tan)]">
              Tonight&apos;s Heat
            </span>
            <h2 className="font-display text-4xl md:text-5xl mt-3 brand-gradient-text">
              Signature Dishes
            </h2>
          </div>
          <Button asChild variant="outline">
            <Link href="/menu">Full Menu →</Link>
          </Button>
        </div>

        {featured.length === 0 ? (
          <EmptyMenuTeaser />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.map((item) => (
              <FeatureCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Story strip */}
      <section className="mx-auto max-w-7xl px-4 md:px-8 py-24 grid md:grid-cols-3 gap-8">
        {[
          {
            icon: <Flame className="h-6 w-6" />,
            title: "Live Hotpot",
            text: "Bubbling broths and dancing flames at every table. Choose your spice, your protein, your night.",
          },
          {
            icon: <Sparkles className="h-6 w-6" />,
            title: "ASMR Specials",
            text: "Sizzling skillets, glistening glazes, hand-pulled noodles — built for the senses.",
          },
          {
            icon: <Clock className="h-6 w-6" />,
            title: "Open Late",
            text: "Midnight cravings welcome. Same kitchen, same fire, no shortcuts.",
          },
        ].map((b, i) => (
          <div key={i} className="glass rounded-3xl p-8">
            <div className="h-12 w-12 grid place-items-center rounded-full bg-[var(--mm-maroon)]/30 text-[var(--mm-tan)] mb-5">
              {b.icon}
            </div>
            <h3 className="font-display text-2xl mb-3">{b.title}</h3>
            <p className="text-sm text-[var(--mm-cream)]/65 leading-relaxed">{b.text}</p>
          </div>
        ))}
      </section>

      {/* Location callout */}
      <section className="mx-auto max-w-7xl px-4 md:px-8 py-24">
        <div className="relative overflow-hidden rounded-3xl glass maroon-glow p-10 md:p-16 text-center">
          <span className="absolute -top-8 -right-6 font-display text-[180px] text-[var(--mm-maroon)]/20 select-none pointer-events-none">
            맛
          </span>
          <div className="relative z-10">
            <span className="text-xs uppercase tracking-[0.4em] text-[var(--mm-tan)]">Visit</span>
            <h3 className="font-display text-3xl md:text-5xl mt-4 brand-gradient-text">
              Gulshan-e-Maymar, Karachi
            </h3>
            <p className="mt-4 text-[var(--mm-cream)]/65 max-w-xl mx-auto">
              Walk in. Sit down. Let the steam hit your face.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
              <Button asChild variant="neon" size="lg">
                <Link href="/reservations">Book a Table</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/contact">
                  <MapPin className="h-4 w-4" /> Get Directions
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function EmptyMenuTeaser() {
  return (
    <div className="glass rounded-3xl p-10 text-center">
      <div className="text-5xl mb-3">🍜</div>
      <h3 className="font-display text-xl mb-2">Menu loading from the kitchen…</h3>
      <p className="text-sm text-[var(--mm-cream)]/60 mb-5">
        Once the chef adds dishes in the Studio, signature plates will appear here.
      </p>
      <Button asChild variant="ghost">
        <Link href="/studio">Open Sanity Studio</Link>
      </Button>
    </div>
  );
}
