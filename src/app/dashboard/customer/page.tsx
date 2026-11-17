import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/layout/SiteHeader";
import SignOutButton from "@/components/auth/SignOutButton";
import BookingCard from "@/components/booking/BookingCard";
import DashboardTabs from "@/components/booking/DashboardTabs";
import { BOOKING_SELECT, type Booking } from "@/lib/bookings";

const TABS = [
  {
    key: "pending",
    label: "Pending",
    statuses: ["requested"],
    asc: true,
    empty: "No pending requests. Once you ask a pro to book, it shows up here until they reply.",
  },
  {
    key: "upcoming",
    label: "Upcoming",
    statuses: ["confirmed", "in_progress"],
    asc: true,
    empty: "No upcoming bookings yet.",
  },
  {
    key: "completed",
    label: "Completed",
    statuses: ["completed"],
    asc: false,
    empty: "Finished jobs appear here.",
  },
  {
    key: "cancelled",
    label: "Cancelled",
    statuses: ["cancelled", "declined"],
    asc: false,
    empty: "Cancelled and declined requests appear here.",
  },
];

export default async function CustomerDashboard({
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
  if (me?.role === "pro") redirect("/dashboard/pro");
  if (me?.role === "admin") redirect("/admin");

  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("customer_id", user.id);
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

  // Names and photos of the pros on these bookings
  const proIds = Array.from(new Set(bookings.map((b) => b.pro_id)));
  const people = new Map<string, { name: string; avatar: string | null }>();
  if (proIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", proIds);
    profiles?.forEach((p) =>
      people.set(p.id, {
        name: p.full_name || "SERVORA Pro",
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
          <h1 className="text-3xl font-bold text-brand-navy">My bookings</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/services"
              className="rounded-full bg-brand-orange px-5 py-2 font-semibold text-white transition-colors hover:bg-brand-orange-dark"
            >
              Find a pro
            </Link>
            <SignOutButton />
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            Couldn&apos;t load your bookings: {error.message}
          </p>
        )}

        <DashboardTabs
          basePath="/dashboard/customer"
          active={active.key}
          tabs={TABS.map((t) => ({
            key: t.key,
            label: t.label,
            count: counts[t.key],
          }))}
        />

        {list.length === 0 && (
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <p className="text-gray-500">{active.empty}</p>
            {(active.key === "pending" || active.key === "upcoming") && (
              <Link
                href="/services"
                className="mt-4 inline-block font-semibold text-brand-orange underline"
              >
                Browse services
              </Link>
            )}
          </div>
        )}

        <div className="space-y-4">
          {list.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              role="customer"
              otherName={people.get(b.pro_id)?.name ?? "SERVORA Pro"}
              otherAvatar={people.get(b.pro_id)?.avatar ?? null}
              unread={unread.get(b.id) ?? 0}
            />
          ))}
        </div>
      </main>
    </div>
  );
}