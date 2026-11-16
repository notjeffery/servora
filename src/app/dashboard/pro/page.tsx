import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/auth/SignOutButton";

export default async function ProDashboard() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pro } = await supabase
    .from("pro_profiles")
    .select("verification_status, rejection_reason")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!pro) redirect("/pro/onboarding");

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Pro dashboard</h1>

      {pro.verification_status === "pending" && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4 text-sm">
          Your application is under review. You'll be able to receive booking
          requests once your license is approved.
        </div>
      )}
      {pro.verification_status === "approved" && (
        <div className="rounded-md border border-green-300 bg-green-50 p-4 text-sm">
          You're approved. Customers can now find and book you.
        </div>
      )}
      {pro.verification_status === "rejected" && (
        <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm">
          Your application wasn't approved.
          {pro.rejection_reason ? ` Reason: ${pro.rejection_reason}` : ""}
        </div>
      )}

      <SignOutButton />
    </main>
  );
}