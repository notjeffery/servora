import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/layout/SiteHeader";
import Avatar from "@/components/ui/Avatar";
import LocalTime from "@/components/ui/LocalTime";
import ChatThread, { type Message } from "@/components/booking/ChatThread";
import { one } from "@/lib/utils";
import {
  BOOKING_SELECT,
  statusBadge,
  statusLabel,
  type Booking,
} from "@/lib/bookings";

export default async function ChatPage({
  params,
}: {
  params: { bookingId: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/messages/${params.bookingId}`)}`);
  }

  const { data } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("id", params.bookingId)
    .maybeSingle();
  if (!data) notFound();

  const booking = data as unknown as Booking;
  const isCustomer = booking.customer_id === user.id;
  const isPro = booking.pro_id === user.id;
  if (!isCustomer && !isPro) notFound();

  const otherId = isCustomer ? booking.pro_id : booking.customer_id;
  const { data: other } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", otherId)
    .maybeSingle();
  const otherName =
    other?.full_name || (isCustomer ? "SERVORA Pro" : "Customer");

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("booking_id", booking.id)
    .order("created_at", { ascending: true })
    .limit(500);

  const canSend = [
    "requested",
    "confirmed",
    "in_progress",
    "completed",
  ].includes(booking.status);
  const dashboard = isCustomer ? "/dashboard/customer" : "/dashboard/pro";
  const category = one(booking.categories)?.name ?? "Service";

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-5 px-6 py-8">
        <Link href={dashboard} className="text-sm font-semibold text-brand-orange">
          ← Back to {isCustomer ? "my bookings" : "my jobs"}
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gray-50 p-4">
          <div className="flex items-center gap-4">
            <Avatar name={otherName} src={other?.avatar_url} size={52} />
            <div>
              <p className="font-bold text-brand-navy">{otherName}</p>
              <p className="text-sm text-gray-600">
                {category} · <LocalTime iso={booking.scheduled_start} />
              </p>
            </div>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              statusBadge[booking.status]
            }`}
          >
            {statusLabel[booking.status]}
          </span>
        </div>

        <ChatThread
          bookingId={booking.id}
          userId={user.id}
          otherName={otherName}
          initialMessages={(messages ?? []) as Message[]}
          canSend={canSend}
        />
      </main>
    </div>
  );
}