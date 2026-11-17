import type { Rel } from "@/lib/utils";

export type BookingStatus =
  | "requested"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "declined";

export type Booking = {
  id: string;
  customer_id: string;
  pro_id: string;
  description: string;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  scheduled_start: string;
  estimated_hours: number;
  hourly_rate: number;
  estimated_total: number;
  status: BookingStatus;
  decline_reason: string | null;
  created_at: string;
  categories: Rel<{ name: string }>;
};

export const BOOKING_SELECT = `
  id, customer_id, pro_id, description, address, city, state, zip,
  scheduled_start, estimated_hours, hourly_rate, estimated_total,
  status, decline_reason, created_at,
  categories ( name )
`;

export const statusLabel: Record<BookingStatus, string> = {
  requested: "Requested",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  declined: "Declined",
};

export const statusBadge: Record<BookingStatus, string> = {
  requested: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  in_progress: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-200 text-gray-700",
  declined: "bg-red-100 text-red-800",
};