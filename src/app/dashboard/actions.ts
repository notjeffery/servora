"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const ALLOWED = [
  "confirmed",
  "declined",
  "in_progress",
  "completed",
  "cancelled",
];

export async function changeBookingStatus(
  id: string,
  status: string,
  reason?: string
): Promise<{ error?: string }> {
  if (!ALLOWED.includes(status)) return { error: "Invalid action." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const update: { status: string; decline_reason?: string | null } = {
    status,
  };
  if (status === "declined" || status === "cancelled") {
    const trimmed = reason?.trim();
    update.decline_reason = trimmed ? trimmed.slice(0, 500) : null;
  }

  // Row-level security limits this to the booking's two participants, and the
  // database trigger only allows valid status changes for each role.
  const { data, error } = await supabase
    .from("bookings")
    .update(update)
    .eq("id", id)
    .select("id");

  if (error) {
    console.error(error);
    return {
      error: error.message.includes("Invalid status change")
        ? "That action isn't available for this booking right now."
        : "Something went wrong. Please try again.",
    };
  }
  if (!data || data.length === 0) return { error: "Booking not found." };

  revalidatePath("/dashboard/pro");
  revalidatePath("/dashboard/customer");
  return {};
}