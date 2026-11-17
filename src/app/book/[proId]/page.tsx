import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/layout/SiteHeader";
import BookingForm from "@/components/booking/BookingForm";
import { one, type Rel } from "@/lib/utils";

type ProData = {
  profile_id: string;
  city: string | null;
  state: string | null;
  profiles: Rel<{ full_name: string; avatar_url: string | null }>;
  pro_categories: {
    hourly_rate: number;
    categories: Rel<{ id: string; name: string }>;
  }[];
};

export default async function BookPage({
  params,
  searchParams,
}: {
  params: { proId: string };
  searchParams: { category?: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const back = `/book/${params.proId}${
      searchParams.category ? `?category=${searchParams.category}` : ""
    }`;
    redirect(`/login?next=${encodeURIComponent(back)}`);
  }

  const { data } = await supabase
    .from("pro_profiles")
    .select(
      `profile_id, city, state,
       profiles ( full_name, avatar_url ),
       pro_categories ( hourly_rate, categories ( id, name ) )`
    )
    .eq("profile_id", params.proId)
    .eq("verification_status", "approved")
    .maybeSingle();
  if (!data) notFound();

  const pro = data as unknown as ProData;
  const prof = one(pro.profiles);
  const proName = prof?.full_name || "SERVORA Pro";

  const trades = pro.pro_categories
    .map((pc) => {
      const c = one(pc.categories);
      return c
        ? { categoryId: c.id, name: c.name, rate: Number(pc.hourly_rate) }
        : null;
    })
    .filter((t): t is NonNullable<typeof t> => t !== null);
  if (trades.length === 0) notFound();

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Link
          href={`/pros/${pro.profile_id}`}
          className="text-sm font-semibold text-brand-orange"
        >
          ← Back to {proName}&apos;s profile
        </Link>

        <div className="mt-6">
          {me?.role === "customer" ? (
            <BookingForm
              customerId={user.id}
              proId={pro.profile_id}
              proName={proName}
              avatarUrl={prof?.avatar_url ?? null}
              location={[pro.city, pro.state].filter(Boolean).join(", ")}
              trades={trades}
              initialCategoryId={searchParams.category}
            />
          ) : (
            <div className="mx-auto max-w-lg rounded-3xl border p-8 text-center">
              <h1 className="text-2xl font-bold text-brand-navy">
                Booking is for customer accounts
              </h1>
              <p className="mt-3 text-gray-600">
                You&apos;re signed in with a {me?.role ?? "different"} account.
                Log out and sign in with a customer account to request a
                booking.
              </p>
              <Link
                href="/dashboard"
                className="mt-6 inline-block font-semibold text-brand-orange underline"
              >
                Go to my dashboard
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}