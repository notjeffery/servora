import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingForm from "@/components/pro/OnboardingForm";

export default async function ProOnboardingPage() {
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
    <main className="mx-auto max-w-2xl p-6">
      <OnboardingForm userId={user.id} categories={categories ?? []} />
    </main>
  );
}