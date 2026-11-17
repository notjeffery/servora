"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  inputClass,
  textareaClass,
  primaryButton,
  Label,
} from "@/components/ui/form";

type Category = {
  id: string;
  name: string;
  min_hourly_rate: number;
  max_hourly_rate: number;
};

type Props = {
  userId: string;
  categories: Category[];
  initialCategoryId?: string;
};

const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function OnboardingForm({
  userId,
  categories,
  initialCategoryId,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bio, setBio] = useState("");
  const [years, setYears] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  // categoryId -> rate (as text). A key being present means "selected".
  const [rates, setRates] = useState<Record<string, string>>(
    initialCategoryId && categories.some((c) => c.id === initialCategoryId)
      ? { [initialCategoryId]: "" }
      : {}
  );
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

    if (!avatarFile) {
      return setError("Add a profile photo so customers can recognise you.");
    }
    if (!AVATAR_TYPES.includes(avatarFile.type)) {
      return setError("Your profile photo must be a JPG, PNG or WebP image.");
    }
    if (avatarFile.size > 3 * 1024 * 1024) {
      return setError("Your profile photo must be under 3 MB.");
    }

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

    // 2. Profile photo goes in the public avatars bucket, in your own folder
    const ext =
      (avatarFile.name.split(".").pop() || "jpg")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "") || "jpg";
    const avatarPath = `${userId}/avatar-${Date.now()}.${ext}`;
    const { error: avatarErr } = await supabase.storage
      .from("avatars")
      .upload(avatarPath, avatarFile, { contentType: avatarFile.type });
    if (avatarErr) return fail(avatarErr.message);

    const { data: pub } = supabase.storage
      .from("avatars")
      .getPublicUrl(avatarPath);
    const { error: avatarProfileErr } = await supabase
      .from("profiles")
      .update({ avatar_url: pub.publicUrl })
      .eq("id", userId);
    if (avatarProfileErr) return fail(avatarProfileErr.message);

    // 3. License document goes in the private bucket
    const safeName = licenseFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${userId}/${Date.now()}-${safeName}`;
    const { error: uploadErr } = await supabase.storage
      .from("license-docs")
      .upload(path, licenseFile);
    if (uploadErr) return fail(uploadErr.message);

    // 4. Private license details
    const { error: verErr } = await supabase.from("pro_verification").upsert({
      profile_id: userId,
      license_number: licenseNumber,
      license_doc_path: path,
    });
    if (verErr) return fail(verErr.message);

    // 5. Trades and rates (the database re-checks the min/max range)
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

  const sectionTitle = "text-xl font-bold text-brand-navy";

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-brand-navy md:text-4xl">
          Set up your pro profile
        </h1>
        <p className="mt-2 text-gray-600">
          We review every license before your profile goes live to customers.
        </p>
      </div>

      <section className="space-y-5">
        <h2 className={sectionTitle}>About you</h2>
        <div>
          <Label htmlFor="avatar" required>
            Profile photo
          </Label>
          <input
            id="avatar"
            className={`${inputClass} !py-2 file:mr-4 file:rounded-full file:border-0 file:bg-brand-navy file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-white`}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
            required
          />
          <p className="mt-2 text-xs text-gray-500">
            A clear photo of your face. JPG, PNG or WebP, up to 3 MB. This is
            shown publicly on your profile.
          </p>
        </div>
        <div>
          <Label htmlFor="bio" required>
            Your bio
          </Label>
          <textarea
            id="bio"
            className={textareaClass}
            rows={4}
            placeholder="Tell customers about your experience and the work you do"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="years" required>
            Years of experience
          </Label>
          <input
            id="years"
            className={inputClass}
            type="number"
            min={0}
            max={60}
            placeholder="e.g. 8"
            value={years}
            onChange={(e) => setYears(e.target.value)}
            required
          />
        </div>
      </section>

      <section className="space-y-5">
        <h2 className={sectionTitle}>Where you work</h2>
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Label htmlFor="city" required>
              City
            </Label>
            <input
              id="city"
              className={inputClass}
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="state" required>
              State
            </Label>
            <input
              id="state"
              className={inputClass}
              placeholder="e.g. TX"
              maxLength={2}
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor="zip" required>
            ZIP code
          </Label>
          <input
            id="zip"
            className={inputClass}
            placeholder="5-digit ZIP"
            pattern="[0-9]{5}"
            maxLength={5}
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            required
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className={sectionTitle}>Your trades and hourly rates</h2>
          <p className="mt-1 text-sm text-gray-600">
            Each trade has an allowed rate range. Pick the trades you offer and
            set your rate for each.
          </p>
        </div>
        {categories.map((c) => {
          const selected = c.id in rates;
          return (
            <div
              key={c.id}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 transition-colors ${
                selected
                  ? "border-brand-orange bg-orange-50"
                  : "border-gray-200"
              }`}
            >
              <label className="flex cursor-pointer items-center gap-3 font-medium text-brand-navy">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-brand-orange"
                  checked={selected}
                  onChange={() => toggleCategory(c.id)}
                />
                {c.name}
                <span className="text-xs font-normal text-gray-500">
                  (${c.min_hourly_rate}–${c.max_hourly_rate}/hr)
                </span>
              </label>
              {selected && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">$</span>
                  <input
                    className="w-28 rounded-full border border-gray-300 bg-white px-4 py-2 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                    type="number"
                    step="0.5"
                    placeholder={`${c.min_hourly_rate}-${c.max_hourly_rate}`}
                    value={rates[c.id]}
                    onChange={(e) => setRate(c.id, e.target.value)}
                    aria-label={`Hourly rate for ${c.name}`}
                  />
                  <span className="text-sm text-gray-500">/hr</span>
                </div>
              )}
            </div>
          );
        })}
      </section>

      <section className="space-y-5">
        <h2 className={sectionTitle}>License or certification</h2>
        <div>
          <Label htmlFor="licenseNumber" required>
            License number
          </Label>
          <input
            id="licenseNumber"
            className={inputClass}
            placeholder="Enter your license number"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="licenseFile" required>
            Upload your license
          </Label>
          <input
            id="licenseFile"
            className={`${inputClass} !py-2 file:mr-4 file:rounded-full file:border-0 file:bg-brand-navy file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-white`}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setLicenseFile(e.target.files?.[0] ?? null)}
            required
          />
          <p className="mt-2 text-xs text-gray-500">
            PDF, JPG or PNG, up to 5 MB. Only you and SERVORA admins can see
            this.
          </p>
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading} className={primaryButton}>
        {loading ? "Submitting..." : "Submit for review"}
      </button>
    </form>
  );
}