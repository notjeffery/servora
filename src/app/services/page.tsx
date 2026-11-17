import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/layout/SiteHeader";

const images: Record<string, string> = {
  painting: "/images/cat-painting.jpg",
  plumbing: "/images/cat-plumbing.jpg",
  hvac: "/images/cat-hvac.jpg",
  drywall: "/images/cat-drywall.jpg",
  "general-construction": "/images/cat-construction.jpg",
};

export default async function ServicesPage() {
  const supabase = createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-3xl font-bold text-brand-navy md:text-4xl">
          What do you need help with?
        </h1>
        <p className="mt-2 text-gray-600">
          Pick a trade to see available pros and their hourly rates.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
          {(categories ?? []).map((c) => (
            <Link
              key={c.id}
              href={`/services/${c.slug}`}
              className="group relative block aspect-[3/4] overflow-hidden rounded-xl bg-gray-200"
            >
              {images[c.slug] && (
                <Image
                  src={images[c.slug]}
                  alt={c.name}
                  fill
                  sizes="(min-width: 768px) 20vw, 50vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <span className="absolute bottom-3 left-3 right-3 font-semibold text-white">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}