import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/auth/SignOutButton";
import { textareaClass } from "@/components/ui/form";
import { approvePro, rejectPro } from "./actions";

type Status = "pending" | "approved" | "rejected";
type Rel<T> = T | T[] | null;

type ProRow = {
  profile_id: string;
  bio: string | null;
  years_experience: number | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  verification_status: Status;
  rejection_reason: string | null;
  created_at: string;
  profiles: Rel<{ full_name: string }>;
  pro_categories: {
    hourly_rate: number;
    categories: Rel<{ name: string }>;
  }[];
  pro_verification: Rel<{
    license_number: string | null;
    license_doc_path: string | null;
  }>;
};

// PostgREST returns one-to-one embeds as an object or a one-item array
function one<T>(value: Rel<T> | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

const tabs: { key: Status; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const badge: Record<Status, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { status?: string };
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
  if (me?.role !== "admin") redirect("/dashboard");

  const { data } = await supabase.from("pro_profiles").select(`
    profile_id, bio, years_experience, city, state, zip,
    verification_status, rejection_reason, created_at,
    profiles ( full_name ),
    pro_categories ( hourly_rate, categories ( name ) ),
    pro_verification ( license_number, license_doc_path )
  `);
  const pros = (data ?? []) as unknown as ProRow[];

  const status: Status =
    tabs.find((t) => t.key === searchParams.status)?.key ?? "pending";

  const counts: Record<Status, number> = {
    pending: pros.filter((p) => p.verification_status === "pending").length,
    approved: pros.filter((p) => p.verification_status === "approved").length,
    rejected: pros.filter((p) => p.verification_status === "rejected").length,
  };

  // Oldest applications first in the pending queue, newest first elsewhere
  const list = pros
    .filter((p) => p.verification_status === status)
    .sort((a, b) =>
      status === "pending"
        ? a.created_at.localeCompare(b.created_at)
        : b.created_at.localeCompare(a.created_at)
    );

  // Short-lived links (10 minutes) to the private license files
  const paths = list
    .map((p) => one(p.pro_verification)?.license_doc_path)
    .filter((p): p is string => !!p);
  const signed = new Map<string, string>();
  if (paths.length > 0) {
    const { data: urls } = await supabase.storage
      .from("license-docs")
      .createSignedUrls(paths, 600);
    urls?.forEach((u) => {
      if (u.path && u.signedUrl) signed.set(u.path, u.signedUrl);
    });
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <Link href="/" aria-label="SERVORA home">
            <Image
              src="/brand/logo.png"
              alt="SERVORA"
              width={640}
              height={203}
              className="h-11 w-auto"
            />
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-600">Admin</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-6 py-10">
        <h1 className="text-3xl font-bold text-brand-navy">
          Pro applications
        </h1>

        <nav className="flex gap-2 border-b">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`/admin?status=${t.key}`}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${
                status === t.key
                  ? "border-brand-orange text-brand-orange"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {t.label} ({counts[t.key]})
            </Link>
          ))}
        </nav>

        {list.length === 0 && (
          <p className="rounded-2xl border border-dashed p-10 text-center text-gray-500">
            No {status} applications.
          </p>
        )}

        {list.map((p) => {
          const name = one(p.profiles)?.full_name || "Unnamed pro";
          const ver = one(p.pro_verification);
          const docUrl = ver?.license_doc_path
            ? signed.get(ver.license_doc_path)
            : undefined;

          return (
            <article key={p.profile_id} className="rounded-2xl border p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-brand-navy">{name}</h2>
                  <p className="text-sm text-gray-600">
                    {[p.city, p.state, p.zip].filter(Boolean).join(", ")} ·{" "}
                    {p.years_experience ?? 0} years experience
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    badge[p.verification_status]
                  }`}
                >
                  {p.verification_status}
                </span>
              </div>

              {p.bio && <p className="mt-4 text-gray-700">{p.bio}</p>}

              <div className="mt-4 flex flex-wrap gap-2">
                {p.pro_categories.map((pc, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-brand-navy"
                  >
                    {one(pc.categories)?.name ?? "Trade"} · ${pc.hourly_rate}/hr
                  </span>
                ))}
              </div>

              <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm">
                <p>
                  <span className="font-semibold">License number:</span>{" "}
                  {ver?.license_number || "Not provided"}
                </p>
                {docUrl ? (
                  <a
                    href={docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block font-semibold text-brand-orange underline"
                  >
                    View license document
                  </a>
                ) : (
                  <p className="mt-1 text-red-600">No document uploaded</p>
                )}
              </div>

              {p.verification_status === "rejected" && p.rejection_reason && (
                <p className="mt-4 text-sm text-red-700">
                  <span className="font-semibold">Reason given:</span>{" "}
                  {p.rejection_reason}
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-start gap-3">
                {p.verification_status !== "approved" && (
                  <form action={approvePro}>
                    <input type="hidden" name="id" value={p.profile_id} />
                    <button className="rounded-full bg-green-600 px-5 py-2 font-semibold text-white hover:bg-green-700">
                      Approve
                    </button>
                  </form>
                )}

                {p.verification_status !== "rejected" && (
                  <details className="rounded-2xl border px-4 py-2">
                    <summary className="cursor-pointer font-semibold text-red-600">
                      {p.verification_status === "approved"
                        ? "Revoke approval"
                        : "Reject"}
                    </summary>
                    <form action={rejectPro} className="mt-3 w-72 space-y-3">
                      <input type="hidden" name="id" value={p.profile_id} />
                      <textarea
                        name="reason"
                        rows={3}
                        required
                        placeholder="Reason (the pro will see this)"
                        className={textareaClass}
                      />
                      <button className="rounded-full bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700">
                        Confirm
                      </button>
                    </form>
                  </details>
                )}
              </div>
            </article>
          );
        })}
      </main>
    </div>
  );
}