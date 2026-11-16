"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import SignupForm from "@/components/auth/SignupForm";
import { inputClass, primaryButton, Label } from "@/components/ui/form";

type Category = {
  id: string;
  name: string;
  min_hourly_rate: number;
  max_hourly_rate: number;
};

export default function ProJoin({ categories }: { categories: Category[] }) {
  const [categoryId, setCategoryId] = useState("");
  const [step, setStep] = useState<"intro" | "account">("intro");
  const selected = categories.find((c) => c.id === categoryId);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-3">
          <Link href="/" aria-label="SERVORA home" className="inline-block">
            <Image
              src="/brand/logo.png"
              alt="SERVORA"
              width={640}
              height={203}
              className="h-11 w-auto"
            />
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[1.2fr_1fr] lg:py-14">
        <div className="relative h-56 overflow-hidden rounded-2xl lg:h-auto lg:min-h-[560px]">
          <Image
            src="/images/contractor-smiling.jpg"
            alt="A smiling tradesperson"
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col justify-center">
          {step === "intro" ? (
            <>
              <h1 className="text-4xl font-bold text-brand-navy md:text-5xl">
                Earn money your way
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                Pick your trade, set your own hourly rate, and get booked by
                customers near you.
              </p>

              <div className="mt-8">
                <Label htmlFor="category">Choose a category</Label>
                <div className="relative">
                  <select
                    id="category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className={`${inputClass} appearance-none pr-12`}
                  >
                    <option value="">Select your trade</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={20}
                    className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                </div>
              </div>

              {selected && (
                <div className="mt-6">
                  <p className="text-4xl font-bold text-brand-navy">
                    ${selected.min_hourly_rate}–${selected.max_hourly_rate}{" "}
                    <span className="text-base font-normal text-gray-600">
                      per hour
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    The rate range for {selected.name} on SERVORA. You choose
                    your rate within it.
                  </p>
                </div>
              )}

              <button
                type="button"
                disabled={!categoryId}
                onClick={() => setStep("account")}
                className={`${primaryButton} mt-8`}
              >
                Get started
              </button>

              <p className="mt-6 text-center text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-brand-orange">
                  Sign in
                </Link>
              </p>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep("intro")}
                className="mb-4 self-start text-sm font-semibold text-brand-orange"
              >
                ← Change category
              </button>
              <SignupForm
                role="pro"
                title="Create your pro account"
                subtitle={`Joining as a ${selected?.name} pro.`}
                redirectTo={`/pro/onboarding?category=${categoryId}`}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}