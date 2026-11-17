import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/layout/SiteHeader";
import Avatar from "@/components/ui/Avatar";
import Rating from "@/components/ui/Rating";
import { one, type Rel } from "@/lib/utils";

type Row = {
  hourly_rate: number;
  pro_profiles: Rel<{
    profile_id: string;
    bio: string | null;
    years_experience: number | null;
    city: string | null;
    state: string | null;
    profiles: Rel<{ full_name: string; avatar_url: string | null }>;
  }>;
};

const sorts = [
  { key: "recommended", label: "Recommended" },
  { key: "price_asc", label: "Price: low to high" },
  { key: "price_desc", label: "Price: high to low" },
];

export default async function ServicePage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { sort?: string };
}) {
  const supabase = createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", params.slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!category) notFound();

  const { data } = await supabase
    .from("pro_categories")
    .select(
      `hourly_rate,
       pro_profiles!inner (
         profile_id, bio, years_experience, city, state, verification_status,
         profiles ( full_name, avatar_url )
       )`
    )
    .eq("category_id", category.id)
    .eq("pro_profiles.verification_status", "approved");
  const rows = (data ?? []) as unknown as Row[];

  // Average ratings from verified reviews
  const ids = rows
    .map((r) => one(r.pro_profiles)?.profile_id)
    .filter((id): id is string => !!id);
  const stats = new Map<string, { sum: number; count: number }>();
  if (ids.length > 0) {
    const { data: reviews } = await supabase
      .from("reviews")
      .select("reviewee_id, rating")
      .in("reviewee_id", ids);
    reviews?.forEach((r) => {
      const s = stats.get(r.reviewee_id) ?? { sum: 0, count: 0 };
      s.sum += r.rating;
      s.count += 1;
      stats.set(r.reviewee_id, s);
    });
  }

  const pros = rows
    .map((r) => {
      const p = one(r.pro_profiles);
      if (!p) return null;
      const prof = one(p.profiles);
      const s = stats.get(p.profile_id);
      return {
        id: p.profile_id,
        name: prof?.full_name || "SERVORA Pro",
        avatar: prof?.avatar_url ?? null,
        bio: p.bio,
        years: p.years_experience,
        city: p.city,
        state: p.state,
        rate: Number(r.hourly_rate),
        avg: s ? s.sum / s.count : null,
        count: s?.count ?? 0,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const sort =
    sorts.find((s) => s.key === searchParams.sort)?.key ?? "recommended";
  pros.sort((a, b) => {
    if (sort === "price_asc") return a.rate - b.rate;
    if (sort === "price_desc") return b.rate - a.rate;
    return (
      (b.avg ?? 0) - (a.avg ?? 0) ||
      b.count - a.count ||
      (b.years ?? 0) - (a.years ?? 0)
    );
  });

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <Link
          href="/services"
          className="text-sm font-semibold text-brand-orange"
        >
          ← All services
        </Link>
        <h1 className="mt-3 text-3xl font-bold text-brand-navy md:text-4xl">
          {category.name}
        </h1>
        <p className="mt-2 text-gray-600">
          {pros.length === 0
            ? "No pros are available yet."
            : `${pros.length} ${pros.length === 1 ? "pro" : "pros"} available. Hourly rates are shown upfront.`}
        </p>

        {pros.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {sorts.map((s) => (
              <Link
                key={s.key}
                href={`/services/${category.slug}?sort=${s.key}`}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  sort === s.key
                    ? "border-brand-navy bg-brand-navy text-white"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {s.label}
              </Link>
            ))}
          </div>
        )}

        {pros.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed p-10 text-center">
            <p className="text-gray-600">
              We're still onboarding {category.name.toLowerCase()} pros in your
              area.
            </p>
            <Link
              href="/pro/signup"
              className="mt-4 inline-block font-semibold text-brand-orange underline"
            >
              Are you a {category.name.toLowerCase()} pro? Join SERVORA
            </Link>
          </div>
        )}

        <div className="mt-8 space-y-4">
          {pros.map((p) => (
            <article
              key={p.id}
              className="flex flex-col gap-5 rounded-2xl border p-5 sm:flex-row sm:items-center"
            >
              <Avatar name={p.name} src={p.avatar} size={88} />
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-brand-navy">{p.name}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Rating average={p.avg} count={p.count} />
                  <span className="text-sm text-gray-600">
                    {[p.city, p.state].filter(Boolean).join(", ")}
                    {p.years != null ? ` · ${p.years} yrs experience` : ""}
                  </span>
                </div>
                {p.bio && (
                  <p className="mt-2 line-clamp-2 text-gray-700">{p.bio}</p>
                )}
              </div>
              <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                <p className="text-2xl font-bold text-brand-navy">
                  ${p.rate}
                  <span className="text-sm font-normal text-gray-600">/hr</span>
                </p>
                <Link
                  href={`/pros/${p.id}?category=${category.id}`}
                  className="rounded-full bg-brand-orange px-5 py-2 font-semibold text-white transition-colors hover:bg-brand-orange-dark"
                >
                  View profile
                </Link>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}