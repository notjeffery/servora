import Link from "next/link";
import { MessageSquare, Star } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import LocalTime from "@/components/ui/LocalTime";
import BookingActions, {
  type ActionDef,
} from "@/components/booking/BookingActions";
import { one } from "@/lib/utils";
import {
  statusBadge,
  statusLabel,
  type Booking,
  type BookingStatus,
} from "@/lib/bookings";

type Role = "customer" | "pro";

function actionsFor(role: Role, status: BookingStatus): ActionDef[] {
  if (role === "pro") {
    if (status === "requested") {
      return [
        { status: "confirmed", label: "Accept", style: "primary" },
        {
          status: "declined",
          label: "Decline",
          style: "danger",
          askReason: true,
        },
      ];
    }
    if (status === "confirmed") {
      return [
        { status: "in_progress", label: "Start job", style: "primary" },
        {
          status: "cancelled",
          label: "Cancel booking",
          style: "danger",
          askReason: true,
        },
      ];
    }
    if (status === "in_progress") {
      return [
        { status: "completed", label: "Mark completed", style: "primary" },
      ];
    }
    return [];
  }

  if (status === "requested") {
    return [
      {
        status: "cancelled",
        label: "Cancel request",
        style: "danger",
        askReason: true,
      },
    ];
  }
  if (status === "confirmed") {
    return [
      {
        status: "cancelled",
        label: "Cancel booking",
        style: "danger",
        askReason: true,
      },
    ];
  }
  return [];
}

export default function BookingCard({
  booking,
  role,
  otherName,
  otherAvatar,
  unread = 0,
  reviewRating,
}: {
  booking: Booking;
  role: Role;
  otherName: string;
  otherAvatar: string | null;
  unread?: number;
  reviewRating?: number | null;
}) {
  const category = one(booking.categories)?.name ?? "Service";

  const area =
    [booking.city, booking.state].filter(Boolean).join(", ") +
    (booking.zip ? ` ${booking.zip}` : "");
  // Pros only see the full street address once they've accepted the job
  const fullAddressVisible =
    role === "customer" ||
    ["confirmed", "in_progress", "completed"].includes(booking.status);
  const where = fullAddressVisible
    ? `${booking.address}, ${area}`
    : `${area} (full address shared once you accept)`;

  const showReason =
    (booking.status === "declined" || booking.status === "cancelled") &&
    booking.decline_reason;

  const canReview = role === "customer" && booking.status === "completed";

  return (
    <article className="rounded-2xl border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <Avatar name={otherName} src={otherAvatar} size={52} />
          <div>
            {role === "customer" ? (
              <Link
                href={`/pros/${booking.pro_id}`}
                className="font-bold text-brand-navy hover:underline"
              >
                {otherName}
              </Link>
            ) : (
              <p className="font-bold text-brand-navy">{otherName}</p>
            )}
            <p className="text-sm text-gray-600">{category}</p>
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

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-gray-500">When</dt>
          <dd className="font-medium">
            <LocalTime iso={booking.scheduled_start} />
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Estimate</dt>
          <dd className="font-medium">
            {booking.estimated_hours} hr · $
            {Number(booking.estimated_total).toFixed(2)} (at $
            {Number(booking.hourly_rate)}/hr)
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-gray-500">Where</dt>
          <dd className="font-medium">{where}</dd>
        </div>
      </dl>

      <p className="mt-4 whitespace-pre-line text-sm text-gray-700">
        {booking.description}
      </p>

      {showReason && (
        <p className="mt-3 text-sm text-gray-600">
          <span className="font-semibold">Reason:</span>{" "}
          {booking.decline_reason}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link
          href={`/messages/${booking.id}`}
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
        >
          <MessageSquare size={16} />
          Message {role === "customer" ? "pro" : "customer"}
          {unread > 0 && (
            <span className="rounded-full bg-brand-orange px-2 py-0.5 text-xs text-white">
              {unread} new
            </span>
          )}
        </Link>

        {canReview &&
          (reviewRating ? (
            <span className="flex items-center gap-2 text-sm text-gray-600">
              Your rating:
              <span className="flex">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={16}
                    className={
                      n <= reviewRating
                        ? "fill-brand-orange text-brand-orange"
                        : "text-gray-300"
                    }
                  />
                ))}
              </span>
            </span>
          ) : (
            <Link
              href={`/review/${booking.id}`}
              className="rounded-full bg-brand-orange px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-orange-dark"
            >
              Leave a review
            </Link>
          ))}
      </div>

      <BookingActions
        bookingId={booking.id}
        actions={actionsFor(role, booking.status)}
      />
    </article>
  );
}