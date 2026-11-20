import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/layout/SiteHeader";
import ProfileEditor, { type Day } from "@/components/pro/ProfileEditor";
import { one, type Rel } from "@/lib/utils";

type ProData = {
  bio: string | null;
  years_experience: number | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  accepting_bookings: boolean;
  verification_status: "pending" | "approved" | "rejected";
  pro_categories: {
    category_id: string;
    hourly_rate: number;
    categories: Rel<{
      id: string;
      name: string;
      min_hourly_rate: number;
      max_hourly_rate: number;
    }>;
  }[];
  pro_availability: {
    day_of_week: number;
    start_time: string;
    end_time: string;
  }[];
};

export default async function ProProfileEditPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("role, full_name, avatar_url")
    .eq("id", user.id)
    .single();
  if (me?.role !== "pro") redirect("/dashboard");

  const { data } = await supabase
    .from("pro_profiles")
    .select(
      `bio, years_experience, city, state, zip, accepting_bookings, verification_status,
       pro_categories ( category_id, hourly_rate, categories ( id, name, min_hourly_rate, max_hourly_rate ) ),
       pro_availability ( day_of_week, start_time, end_time )`
    )
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!data) redirect("/pro/onboarding");
  const pro = data as unknown as ProData;

  const trades = pro.pro_categories
    .map((pc) => {
      const c = one(pc.categories);
      return c
        ? {
            categoryId: c.id,
            name: c.name,
            rate: Number(pc.hourly_rate),
            min: Number(c.min_hourly_rate),
            max: Number(c.max_hourly_rate),
          }
        : null;
    })
    .filter((t): t is NonNullable<typeof t> => t !== null);

  // No schedule saved yet: suggest Monday to Friday, 8 AM to 5 PM
  const hasSchedule = pro.pro_availability.length > 0;
  const availability: Day[] = Array.from({ length: 7 }, (_, i) => {
    const row = pro.pro_availability.find((a) => a.day_of_week === i);
    if (row) {
      return {
        enabled: true,
        start: row.start_time.slice(0, 5),
        end: row.end_time.slice(0, 5),
      };
    }
    return {
      enabled: !hasSchedule && i >= 1 && i <= 5,
      start: "08:00",
      end: "17:00",
    };
  });

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-8 px-6 py-10">
        <div>
          <Link
            href="/dashboard/pro"
            className="text-sm font-semibold text-brand-orange"
          >
            ← Back to my jobs
          </Link>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-bold text-brand-navy">
              Edit your profile
            </h1>
            {pro.verification_status === "approved" && (
              <Link
                href={`/pros/${user.id}`}
                className="font-semibold text-brand-orange underline"
              >
                View public profile
              </Link>
            )}
          </div>
        </div>

        <ProfileEditor
          userId={user.id}
          initial={{
            fullName: me.full_name ?? "",
            avatarUrl: me.avatar_url,
            bio: pro.bio ?? "",
            years: String(pro.years_experience ?? ""),
            city: pro.city ?? "",
            state: pro.state ?? "",
            zip: pro.zip ?? "",
            accepting: pro.accepting_bookings,
          }}
          trades={trades}
          availability={availability}
        />
      </main>
    </div>
  );
}