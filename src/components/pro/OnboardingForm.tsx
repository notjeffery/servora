"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Category = {
  id: string;
  name: string;
  min_hourly_rate: number;
  max_hourly_rate: number;
};

type Props = { userId: string; categories: Category[] };

export default function OnboardingForm({ userId, categories }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [bio, setBio] = useState("");
  const [years, setYears] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  // categoryId -> rate (as text). A key being present means "selected".
  const [rates, setRates] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleCategory(id: string) {
    setRates((prev) => {
      const next = { ...prev };
      if (id in next) delete next[id];
      else next[id] = "";
      return next;
    });
  }

  function setRate(id: string, value: string) {
    setRates((prev) => ({ ...prev, [id]: value }));
  }

  function fail(message: string) {
    setError(message);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const selected = categories.filter((c) => c.id in rates);
    if (selected.length === 0) return setError("Pick at least one trade.");

    for (const c of selected) {
      const rate = Number(rates[c.id]);
      if (!rates[c.id] || Number.isNaN(rate)) {
        return setError(`Enter an hourly rate for ${c.name}.`);
      }
      if (rate < c.min_hourly_rate || rate > c.max_hourly_rate) {
        return setError(
          `${c.name} rate must be between $${c.min_hourly_rate} and $${c.max_hourly_rate} per hour.`
        );
      }
    }

    if (!licenseFile) {
      return setError("Upload a copy of your license or certification.");
    }
    if (licenseFile.size > 5 * 1024 * 1024) {
      return setError("The license file must be under 5 MB.");
    }

    setLoading(true);

    // 1. Public pro profile (starts as 'pending')
    const { error: profileErr } = await supabase.from("pro_profiles").upsert({
      profile_id: userId,
      bio,
      years_experience: Number(years),
      city,
      state: state.toUpperCase(),
      zip,
    });
    if (profileErr) return fail(profileErr.message);

    // 2. License document goes in the private bucket, under your own user id folder
    const safeName = licenseFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${userId}/${Date.now()}-${safeName}`;
    const { error: uploadErr } = await supabase.storage
      .from("license-docs")
      .upload(path, licenseFile);
    if (uploadErr) return fail(uploadErr.message);

    // 3. Private license details
    const { error: verErr } = await supabase.from("pro_verification").upsert({
      profile_id: userId,
      license_number: licenseNumber,
      license_doc_path: path,
    });
    if (verErr) return fail(verErr.message);

    // 4. Trades and rates (the database re-checks the min/max range)
    const { error: catErr } = await supabase.from("pro_categories").upsert(
      selected.map((c) => ({
        pro_id: userId,
        category_id: c.id,
        hourly_rate: Number(rates[c.id]),
      }))
    );
    if (catErr) return fail(catErr.message);

    router.push("/dashboard/pro");
    router.refresh();
  }

  const inputClass = "w-full rounded-md border px-3 py-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border p-6">
      <div>
        <h1 className="text-2xl font-semibold">Set up your pro profile</h1>
        <p className="text-sm text-gray-600">
          We review every license before your profile goes live to customers.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-medium">About you</h2>
        <textarea
          className={inputClass}
          rows={4}
          placeholder="Tell customers about your experience and the work you do"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          required
        />
        <input
          className={inputClass}
          type="number"
          min={0}
          max={60}
          placeholder="Years of experience"
          value={years}
          onChange={(e) => setYears(e.target.value)}
          required
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Where you work</h2>
        <div className="grid grid-cols-3 gap-3">
          <input
            className={`${inputClass} col-span-2`}
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          />
          <input
            className={inputClass}
            placeholder="State (e.g. TX)"
            maxLength={2}
            value={state}
            onChange={(e) => setState(e.target.value)}
            required
          />
        </div>
        <input
          className={inputClass}
          placeholder="ZIP code"
          pattern="[0-9]{5}"
          maxLength={5}
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          required
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Your trades and hourly rates</h2>
        {categories.map((c) => {
          const selected = c.id in rates;
          return (
            <div
              key={c.id}
              className="flex items-center justify-between gap-4 rounded-md border p-3"
            >
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleCategory(c.id)}
                />
                <span>{c.name}</span>
              </label>
              {selected && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">$</span>
                  <input
                    className="w-24 rounded-md border px-2 py-1"
                    type="number"
                    step="0.5"
                    placeholder={`${c.min_hourly_rate}-${c.max_hourly_rate}`}
                    value={rates[c.id]}
                    onChange={(e) => setRate(c.id, e.target.value)}
                  />
                  <span className="text-sm text-gray-500">/hr</span>
                </div>
              )}
            </div>
          );
        })}
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">License or certification</h2>
        <input
          className={inputClass}
          placeholder="License number"
          value={licenseNumber}
          onChange={(e) => setLicenseNumber(e.target.value)}
          required
        />
        <input
          className={inputClass}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => setLicenseFile(e.target.files?.[0] ?? null)}
          required
        />
        <p className="text-xs text-gray-500">
          PDF, JPG or PNG, up to 5 MB. Only you and SERVORA admins can see this.
        </p>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit for review"}
      </button>
    </form>
  );
}