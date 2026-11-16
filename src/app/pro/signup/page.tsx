import { createClient } from "@/lib/supabase/server";
import ProJoin from "@/components/pro/ProJoin";

export default async function ProSignupPage() {
  const supabase = createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, min_hourly_rate, max_hourly_rate")
    .eq("is_active", true)
    .order("name");

  return <ProJoin categories={categories ?? []} />;
}