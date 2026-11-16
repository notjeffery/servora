"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import PasswordInput from "@/components/auth/PasswordInput";
import { inputClass, primaryButton, Label } from "@/components/ui/form";

type Props = {
  role: "customer" | "pro";
  title: string;
  subtitle?: string;
  redirectTo?: string;
};

const rules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "At least one number", test: (p: string) => /\d/.test(p) },
  {
    label: "At least one special character (e.g. ! @ # $ %)",
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
  },
];

export default function SignupForm({
  role,
  title,
  subtitle,
  redirectTo = "/dashboard",
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isPro = role === "pro";
  const allRulesPass = rules.every((r) => r.test(password));
  const matches = confirm.length > 0 && password === confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!allRulesPass) {
      setError("Your password doesn't meet all the requirements yet.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (!agreed) {
      setError("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setLoading(true);

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
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

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-navy">{title}</h1>
        {subtitle && <p className="mt-2 text-gray-600">{subtitle}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName" required>
            First name
          </Label>
          <input
            id="firstName"
            className={inputClass}
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName" required>
            Last name
          </Label>
          <input
            id="lastName"
            className={inputClass}
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
            required
          />
        </div>
      </div>

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
          placeholder="Enter a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
        <ul className="mt-3 space-y-1 text-sm">
          {rules.map((r) => {
            const ok = r.test(password);
            return (
              <li
                key={r.label}
                className={`flex items-center gap-2 ${
                  ok ? "text-green-600" : "text-gray-500"
                }`}
              >
                {ok ? <Check size={14} /> : <Circle size={14} />}
                {r.label}
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <Label htmlFor="confirm" required>
          Confirm password
        </Label>
        <PasswordInput
          id="confirm"
          placeholder="Re-enter your password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
        />
        {confirm.length > 0 && (
          <p
            className={`mt-2 text-sm ${
              matches ? "text-green-600" : "text-red-600"
            }`}
          >
            {matches ? "Passwords match" : "Passwords don't match yet"}
          </p>
        )}
      </div>

      <label className="flex items-start gap-3 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1 h-4 w-4 accent-brand-orange"
          required
        />
        <span>
          I agree to the{" "}
          <Link
            href="/terms"
            target="_blank"
            className="font-semibold text-brand-orange underline"
          >
            Terms of Service
          </Link>{" "}
          and have reviewed the{" "}
          <Link
            href="/privacy"
            target="_blank"
            className="font-semibold text-brand-orange underline"
          >
            Privacy Policy
          </Link>
          .
        </span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading} className={primaryButton}>
        {loading ? "Creating account..." : "Create account"}
      </button>

      <div className="space-y-1 text-center text-sm text-gray-600">
        <p>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-orange">
            Log in
          </Link>
        </p>
        <p>
          {isPro ? (
            <Link href="/signup" className="font-semibold text-brand-orange">
              Looking to hire instead?
            </Link>
          ) : (
            <Link
              href="/pro/signup"
              className="font-semibold text-brand-orange"
            >
              Are you a pro? Join here
            </Link>
          )}
        </p>
      </div>
    </form>
  );
}