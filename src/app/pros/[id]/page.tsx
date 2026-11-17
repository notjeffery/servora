import Link from "next/link";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/layout/SiteHeader";
import Avatar from "@/components/ui/Avatar";
import Rating from "@/components/ui/Rating";
import BookingCard from "@/components/pro/BookingCard";
import { one, type Rel } from "@/lib/utils";

type ProData = {
  profile_id: string;
  bio: string | null;
  years_experience: number | null;
  city: string | null;
  state: string | null;
  created_at: string;
  profiles: Rel<{ full_name: string; avatar_url: string | null }>;
  pro_categories: {
    hourly_rate: number;
    categories: Rel<{ id: string; name: string; slug: string }>;
  }[];
};

export default async function ProProfilePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { category?: string };
}) {
  const supabase = createClient();

  const { data } = await supabase
    .from("pro_profiles")
    .select(
      `profile_id, bio, years_experience, city, state, created_at,
       profiles ( full_name, avatar_url ),
       pro_categories ( hourly_rate, categories ( id, name, slug ) )`
    )
    .eq("profile_id", params.id)
    .eq("verification_status", "approved")
    .maybeSingle();
  if (!data) notFound();

  const pro = data as unknown as ProData;
  const prof = one(pro.profiles);
  const name = prof?.full_name || "SERVORA Pro";

  const trades = pro.pro_categories
    .map((pc) => {
      const c = one(pc.categories);
      return c
        ? { categoryId: c.id, name: c.name, slug: c.slug, rate: Number(pc.hourly_rate) }
        : null;
    })
    .filter((t): t is NonNullable<typeof t> => t !== null);

  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating, comment, created_at")
    .eq("reviewee_id", pro.profile_id)
    .order("created_at", { ascending: false })
    .limit(20);

  const count = reviews?.length ?? 0;
  const average =
    count > 0 ? reviews!.reduce((sum, r) => sum + r.rating, 0) / count : null;

  const joined = new Date(pro.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-10">
          <section className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <Avatar name={name} src={prof?.avatar_url} size={128} />
            <div>
              <h1 className="text-3xl font-bold text-brand-navy md:text-4xl">
                {name}
              </h1>
              <div className="mt-2">
                <Rating average={average} count={count} />
              </div>
              <p className="mt-2 text-gray-600">
                {[pro.city, pro.state].filter(Boolean).join(", ")}
                {pro.years_experience != null
                  ? ` · ${pro.years_experience} years experience`
                  : ""}
              </p>
              <p className="text-sm text-gray-500">On SERVORA since {joined}</p>
            </div>
          </section>

          {pro.bio && (
            <section>
              <h2 className="text-xl font-bold text-brand-navy">About</h2>
              <p className="mt-3 whitespace-pre-line text-gray-700">{pro.bio}</p>
            </section>
          )}

          <section>
            <h2 className="text-xl font-bold text-brand-navy">
              Services and rates
            </h2>
            <ul className="mt-3 divide-y rounded-2xl border">
              {trades.map((t) => (
                <li
                  key={t.categoryId}
                  className="flex items-center justify-between px-5 py-4"
                >
                  <Link
                    href={`/services/${t.slug}`}
                    className="font-medium text-brand-navy hover:underline"
                  >
                    {t.name}
                  </Link>
                  <span className="font-semibold">${t.rate}/hr</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-brand-navy">
              Reviews ({count})
            </h2>
            {count === 0 ? (
              <p className="mt-3 text-gray-500">
                No reviews yet. Reviews appear here after customers complete a
                booking.
              </p>
            ) : (
              <ul className="mt-3 space-y-4">
                {reviews!.map((r, i) => (
                  <li key={i} className="rounded-2xl border p-5">
                    <div className="flex items-center justify-between">
                      <span className="flex">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            size={16}
                            className={
                              n <= r.rating
                                ? "fill-brand-orange text-brand-orange"
                                : "text-gray-300"
                            }
                          />
                        ))}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(r.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    {r.comment && (
                      <p className="mt-3 text-gray-700">{r.comment}</p>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                      Verified customer
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside>
          <div className="lg:sticky lg:top-24">
            <BookingCard
              proId={pro.profile_id}
              trades={trades}
              initialCategoryId={searchParams.category}
            />
          </div>
        </aside>
      </main>
    </div>
  );
}