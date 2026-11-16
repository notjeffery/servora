"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PasswordInput from "@/components/auth/PasswordInput";
import {
  inputClass,
  primaryButton,
  outlineButton,
  Label,
} from "@/components/ui/form";

export default function LoginForm() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error(error);
      setError(
        error.message.toLowerCase().includes("fetch")
          ? "Couldn't reach the server. Check your internet connection and try again."
          : error.message
      );
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h1 className="text-3xl font-bold text-brand-navy">Welcome back</h1>

      <div>
        <Label htmlFor="email" required>
          Email address
        </Label>
        <input
          id="email"
          type="email"
          className={inputClass}
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </div>

      <div>
        <Label htmlFor="password" required>
          Password
        </Label>
        <PasswordInput
          id="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading} className={primaryButton}>
        {loading ? "Logging in..." : "Log in"}
      </button>

      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="h-px flex-1 bg-gray-200" />
        OR
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <Link href="/signup" className={outlineButton}>
        Sign up instead
      </Link>
    </form>
  );
}