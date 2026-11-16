"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Props = { role: "customer" | "pro" };

export default function SignupForm({ role }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isPro = role === "pro";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-16 w-full max-w-md space-y-4 rounded-xl border p-6"
    >
      <h1 className="text-2xl font-semibold">
        {isPro ? "Join SERVORA as a pro" : "Create your SERVORA account"}
      </h1>
      <p className="text-sm text-gray-600">
        {isPro
          ? "Offer your trade and get booked by customers near you."
          : "Book trusted tradespeople for your next job."}
      </p>

      <input
        className="w-full rounded-md border px-3 py-2"
        placeholder="Full name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
      />
      <input
        className="w-full rounded-md border px-3 py-2"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        className="w-full rounded-md border px-3 py-2"
        type="password"
        placeholder="Password (min 8 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={8}
        required
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Creating account..." : "Sign up"}
      </button>

      <p className="text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Log in
        </Link>
      </p>
      <p className="text-sm text-gray-600">
        {isPro ? (
          <Link href="/signup" className="underline">
            Looking to hire instead?
          </Link>
        ) : (
          <Link href="/pro/signup" className="underline">
            Are you a pro? Join here
          </Link>
        )}
      </p>
    </form>
  );
}