import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingForm from "@/components/pro/OnboardingForm";

export default async function ProOnboardingPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "pro") redirect("/dashboard");

  const { data: existing } = await supabase
    .from("pro_profiles")
    .select("profile_id")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (existing) redirect("/dashboard/pro");

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, min_hourly_rate, max_hourly_rate")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-3">
          <Link href="/" aria-label="SERVORA home" className="inline-block">
            <Image
              src="/brand/logo.png"
              alt="SERVORA"
              width={640}
              height={203}
              className="h-11 w-auto"
            />
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[1fr_1.2fr]">
        <div className="relative hidden lg:block">
          <div className="sticky top-8 h-[calc(100vh-8rem)] overflow-hidden rounded-2xl">
            <Image
              src="/images/handyman-toolbox.jpg"
              alt="A handyman with a toolbox"
              fill
              priority
              sizes="40vw"
              className="object-cover"
            />
          </div>
        </div>

        <OnboardingForm
          userId={user.id}
          categories={categories ?? []}
          initialCategoryId={searchParams.category}
        />
      </main>
    </div>
  );
}