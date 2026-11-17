import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/layout/SiteHeader";
import SignOutButton from "@/components/auth/SignOutButton";
import BookingCard from "@/components/booking/BookingCard";
import DashboardTabs from "@/components/booking/DashboardTabs";
import { BOOKING_SELECT, type Booking } from "@/lib/bookings";

const TABS = [
  {
    key: "requests",
    label: "Requests",
    statuses: ["requested"],
    asc: true,
    empty: "No new requests. When a customer asks to book you, it shows up here.",
  },
  {
    key: "upcoming",
    label: "Upcoming",
    statuses: ["confirmed", "in_progress"],
    asc: true,
    empty: "No upcoming jobs yet.",
  },
  {
    key: "past",
    label: "Past",
    statuses: ["completed", "declined", "cancelled"],
    asc: false,
    empty: "Completed, declined and cancelled jobs appear here.",
  },
];

export default async function ProDashboard({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "pro") {
    redirect(me?.role === "admin" ? "/admin" : "/dashboard/customer");
  }

  const { data: pro } = await supabase
    .from("pro_profiles")
    .select("verification_status, rejection_reason")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!pro) redirect("/pro/onboarding");

  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("pro_id", user.id);
  const bookings = (data ?? []) as unknown as Booking[];

  // Unread messages per booking
  const unread = new Map<string, number>();
  if (bookings.length > 0) {
    const { data: unreadRows } = await supabase
      .from("messages")
      .select("booking_id")
      .neq("sender_id", user.id)
      .is("read_at", null)
      .in(
        "booking_id",
        bookings.map((b) => b.id)
      );
    unreadRows?.forEach((r) =>
      unread.set(r.booking_id, (unread.get(r.booking_id) ?? 0) + 1)
    );
  }

  // Names and photos of the customers on these bookings
  const customerIds = Array.from(new Set(bookings.map((b) => b.customer_id)));
  const people = new Map<string, { name: string; avatar: string | null }>();
  if (customerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", customerIds);
    profiles?.forEach((p) =>
      people.set(p.id, {
        name: p.full_name || "Customer",
        avatar: p.avatar_url,
      })
    );
  }

  const counts: Record<string, number> = {};
  TABS.forEach((t) => {
    counts[t.key] = bookings.filter((b) => t.statuses.includes(b.status)).length;
  });

  const active =
    TABS.find((t) => t.key === searchParams.tab) ??
    TABS.find((t) => counts[t.key] > 0) ??
    TABS[0];

  const list = bookings
    .filter((b) => active.statuses.includes(b.status))
    .sort((a, b) =>
      active.asc
        ? a.scheduled_start.localeCompare(b.scheduled_start)
        : b.scheduled_start.localeCompare(a.scheduled_start)
    );

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="mx-auto max-w-4xl space-y-6 px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold text-brand-navy">Your jobs</h1>
          <SignOutButton />
        </div>

        {pro.verification_status === "pending" && (
          <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm">
            Your application is under review. You&apos;ll be able to receive
            booking requests once your license is approved.
          </div>
        )}
        {pro.verification_status === "approved" && (
          <div className="rounded-xl border border-green-300 bg-green-50 p-4 text-sm">
            You&apos;re approved. Customers can now find and book you.
          </div>
        )}
        {pro.verification_status === "rejected" && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm">
            Your application wasn&apos;t approved.
            {pro.rejection_reason ? ` Reason: ${pro.rejection_reason}` : ""}
          </div>
        )}

        {error && (
          <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            Couldn&apos;t load your jobs: {error.message}
          </p>
        )}

        <DashboardTabs
          basePath="/dashboard/pro"
          active={active.key}
          tabs={TABS.map((t) => ({
            key: t.key,
            label: t.label,
            count: counts[t.key],
          }))}
        />

        {active.key === "requests" && list.length > 0 && (
          <p className="text-sm text-gray-600">
            Reply soon. Customers are waiting, and fast replies get you more
            jobs.
          </p>
        )}

        {list.length === 0 && (
          <p className="rounded-2xl border border-dashed p-10 text-center text-gray-500">
            {active.empty}
          </p>
        )}

        <div className="space-y-4">
          {list.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              role="pro"
              otherName={people.get(b.customer_id)?.name ?? "Customer"}
              otherAvatar={people.get(b.customer_id)?.avatar ?? null}
              unread={unread.get(b.id) ?? 0}
            />
          ))}
        </div>
      </main>
    </div>
  );
}