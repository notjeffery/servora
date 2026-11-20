import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/layout/SiteHeader";
import ReviewForm from "@/components/booking/ReviewForm";
import { one } from "@/lib/utils";
import { BOOKING_SELECT, type Booking } from "@/lib/bookings";

export default async function ReviewPage({
  params,
}: {
  params: { bookingId: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/review/${params.bookingId}`)}`);
  }

  const { data } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("id", params.bookingId)
    .eq("customer_id", user.id)
    .maybeSingle();
  if (!data) notFound();
  const booking = data as unknown as Booking;

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("booking_id", booking.id)
    .eq("reviewer_id", user.id)
    .maybeSingle();
  if (existing) redirect("/dashboard/customer?tab=completed");

  const { data: pro } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", booking.pro_id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href="/dashboard/customer?tab=completed"
          className="mb-6 inline-block text-sm font-semibold text-brand-orange"
        >
          ← Back to my bookings
        </Link>

        {booking.status === "completed" ? (
          <ReviewForm
            bookingId={booking.id}
            customerId={user.id}
            proId={booking.pro_id}
            proName={pro?.full_name || "your pro"}
            avatarUrl={pro?.avatar_url ?? null}
            category={one(booking.categories)?.name ?? "service"}
          />
        ) : (
          <div className="mx-auto max-w-lg rounded-3xl border p-8 text-center">
            <h1 className="text-2xl font-bold text-brand-navy">
              This job isn&apos;t finished yet
            </h1>
            <p className="mt-3 text-gray-600">
              You can leave a review once your pro marks the job as completed.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}