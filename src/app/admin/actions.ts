"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") throw new Error("Not authorized");

  return supabase;
}

export async function approvePro(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id"));

  const { error } = await supabase
    .from("pro_profiles")
    .update({ verification_status: "approved", rejection_reason: null })
    .eq("profile_id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}

export async function rejectPro(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id"));
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) throw new Error("A reason is required");

  const { error } = await supabase
    .from("pro_profiles")
    .update({ verification_status: "rejected", rejection_reason: reason })
    .eq("profile_id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}