import { sanityClient, urlFor } from "@/sanity/client";
import { groq } from "next-sanity";
import Image from "next/image";

export const revalidate = 60;
export const metadata = { title: "Gallery — Moosa Ministry" };

const galleryQuery = groq`
  *[_type == "menuItem" && isAvailable == true && defined(images) && count(images) > 0][0...24]{
    _id, name, "img": images[0]
  }
`;

export default async function GalleryPage() {
  let items: { _id: string; name: string; img: { asset: { _ref: string } } }[] = [];
  try {
    items = await sanityClient.fetch(galleryQuery);
  } catch {}

  return (
    <div className="pt-32 pb-24 mx-auto max-w-7xl px-4 md:px-8">
      <header className="text-center mb-12">
        <span className="text-xs uppercase tracking-[0.4em] text-[var(--mm-tan)]">Gallery</span>
        <h1 className="font-display text-5xl md:text-7xl mt-4 brand-gradient-text">
          ASMR, Plated.
        </h1>
      </header>

      {items.length === 0 ? (
        <div className="glass rounded-3xl p-16 text-center text-[var(--mm-cream)]/60">
          Add menu items with photos in the Studio to populate the gallery.
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 [column-fill:_balance]">
          {items.map((it, i) => (
            <div
              key={it._id}
              className="mb-4 break-inside-avoid overflow-hidden rounded-2xl glass group"
              style={{ aspectRatio: i % 3 === 0 ? "3/4" : i % 3 === 1 ? "1/1" : "4/5" }}
            >
              <div className="relative h-full w-full">
                <Image
                  src={urlFor(it.img).width(640).url()}
                  alt={it.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
                <div className="absolute bottom-0 inset-x-0 p-3 text-sm font-display opacity-0 group-hover:opacity-100 transition">
                  {it.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
