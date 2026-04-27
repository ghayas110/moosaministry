import { Logo } from "@/components/brand/Logo";

export const metadata = { title: "About — Moosa Ministry" };

export default function AboutPage() {
  return (
    <div className="pt-32 pb-24 mx-auto max-w-4xl px-4 md:px-8">
      <header className="text-center mb-12">
        <span className="text-xs uppercase tracking-[0.4em] text-[var(--mm-tan)]">
          Our Story
        </span>
        <h1 className="font-display text-5xl md:text-7xl mt-4 brand-gradient-text">
          From Seoul, with Heat.
        </h1>
      </header>

      <div className="grid md:grid-cols-[200px_1fr] gap-10 items-start">
        <div className="grid place-items-center">
          <Logo size={180} />
        </div>
        <div className="space-y-5 text-[var(--mm-cream)]/75 leading-relaxed">
          <p>
            Moosa Ministry was born from one obsession: the slow, ceremonial pleasure
            of Korean street food. The hiss of broth hitting hot stone. The pull of
            hand-cut noodles. The folded dumpling, the brushed glaze, the kimchi crackle.
          </p>
          <p>
            We&apos;re a tiny kitchen in Gulshan-e-Maymar, Karachi — fed by
            late-night hunger and a deep love for Pan-Asian cooking. Our menu rotates,
            our broths simmer for hours, and our chopsticks are always within reach.
          </p>
          <p>
            Walk in. Sit down. Let the steam hit your face.
          </p>
        </div>
      </div>

      <div className="mt-20 grid md:grid-cols-3 gap-6">
        {[
          { k: "Hand-folded", v: "Every dumpling, every day." },
          { k: "Live fire", v: "Hotpots and grills at the table." },
          { k: "Halal kitchen", v: "All meats sourced & certified." },
        ].map((b) => (
          <div key={b.k} className="glass rounded-2xl p-6">
            <div className="text-xs uppercase tracking-[0.3em] text-[var(--mm-tan)]">
              {b.k}
            </div>
            <div className="mt-2 text-lg">{b.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
