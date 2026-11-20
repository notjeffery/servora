"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Avatar from "@/components/ui/Avatar";
import {
  inputClass,
  textareaClass,
  primaryButton,
  Label,
} from "@/components/ui/form";

type Trade = {
  categoryId: string;
  name: string;
  rate: number;
  min: number;
  max: number;
};

export type Day = { enabled: boolean; start: string; end: string };

type Props = {
  userId: string;
  initial: {
    fullName: string;
    avatarUrl: string | null;
    bio: string;
    years: string;
    city: string;
    state: string;
    zip: string;
    accepting: boolean;
  };
  trades: Trade[];
  availability: Day[]; // 7 entries, index = day of week (0 = Sunday)
};

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ProfileEditor({
  userId,
  initial,
  trades,
  availability,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState(initial.fullName);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bio, setBio] = useState(initial.bio);
  const [years, setYears] = useState(initial.years);
  const [city, setCity] = useState(initial.city);
  const [state, setState] = useState(initial.state);
  const [zip, setZip] = useState(initial.zip);
  const [accepting, setAccepting] = useState(initial.accepting);
  const [rates, setRates] = useState<Record<string, string>>(
    Object.fromEntries(trades.map((t) => [t.categoryId, String(t.rate)]))
  );
  const [days, setDays] = useState<Day[]>(availability);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  function setDay(i: number, patch: Partial<Day>) {
    setDays((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  }

  function fail(message: string) {
    setError(message);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (!fullName.trim()) return setError("Enter your name.");
    if (bio.trim().length < 20) {
      return setError("Write a bit more in your bio (at least 20 characters).");
    }
    for (const t of trades) {
      const rate = Number(rates[t.categoryId]);
      if (!rates[t.categoryId] || Number.isNaN(rate)) {
        return setError(`Enter an hourly rate for ${t.name}.`);
      }
      if (rate < t.min || rate > t.max) {
        return setError(
          `${t.name} rate must be between $${t.min} and $${t.max} per hour.`
        );
      }
    }
    for (let i = 0; i < 7; i++) {
      const d = days[i];
      if (d.enabled && d.end <= d.start) {
        return setError(`${DAY_NAMES[i]}: the end time must be after the start time.`);
      }
    }
    if (avatarFile) {
      if (!AVATAR_TYPES.includes(avatarFile.type)) {
        return setError("Your photo must be a JPG, PNG or WebP image.");
      }
      if (avatarFile.size > 3 * 1024 * 1024) {
        return setError("Your photo must be under 3 MB.");
      }
    }

    setLoading(true);

    // 1. New profile photo, if one was chosen
    let newAvatarUrl: string | undefined;
    if (avatarFile) {
      const ext =
        (avatarFile.name.split(".").pop() || "jpg")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, avatarFile, { contentType: avatarFile.type });
      if (upErr) return fail(upErr.message);
      newAvatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data
        .publicUrl;
    }

    // 2. Name and photo
    const profileUpdate: { full_name: string; avatar_url?: string } = {
      full_name: fullName.trim(),
    };
    if (newAvatarUrl) profileUpdate.avatar_url = newAvatarUrl;
    const { error: profErr } = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("id", userId);
    if (profErr) return fail(profErr.message);

    // 3. Public pro details
    const { error: proErr } = await supabase
      .from("pro_profiles")
      .update({
        bio: bio.trim(),
        years_experience: Number(years),
        city: city.trim(),
        state: state.trim().toUpperCase(),
        zip: zip.trim(),
        accepting_bookings: accepting,
      })
      .eq("profile_id", userId);
    if (proErr) return fail(proErr.message);

    // 4. Rates (the database re-checks each trade's min/max range)
    for (const t of trades) {
      const { error: rateErr } = await supabase
        .from("pro_categories")
        .update({ hourly_rate: Number(rates[t.categoryId]) })
        .eq("pro_id", userId)
        .eq("category_id", t.categoryId);
      if (rateErr) return fail(rateErr.message);
    }

    // 5. Weekly availability: replace the old schedule
    const { error: delErr } = await supabase
      .from("pro_availability")
      .delete()
      .eq("pro_id", userId);
    if (delErr) return fail(delErr.message);

    const rows = days
      .map((d, i) =>
        d.enabled
          ? {
              pro_id: userId,
              day_of_week: i,
              start_time: d.start,
              end_time: d.end,
            }
          : null
      )
      .filter((r): r is NonNullable<typeof r> => r !== null);
    if (rows.length > 0) {
      const { error: insErr } = await supabase
        .from("pro_availability")
        .insert(rows);
      if (insErr) return fail(insErr.message);
    }

    if (newAvatarUrl) {
      setAvatarUrl(newAvatarUrl);
      setAvatarFile(null);
    }
    setSaved(true);
    setLoading(false);
    router.refresh();
  }

  const sectionTitle = "text-xl font-bold text-brand-navy";

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <section className="space-y-5">
        <h2 className={sectionTitle}>About you</h2>
        <div className="flex items-center gap-5">
          <Avatar name={fullName || "Pro"} src={avatarUrl} size={88} />
          <div className="min-w-0 flex-1">
            <Label htmlFor="avatar">Change profile photo</Label>
            <input
              id="avatar"
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
              className={`${inputClass} !py-2 file:mr-4 file:rounded-full file:border-0 file:bg-brand-navy file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-white`}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="fullName" required>
            Your name
          </Label>
          <input
            id="fullName"
            className={inputClass}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="bio" required>
            Your bio
          </Label>
          <textarea
            id="bio"
            className={textareaClass}
            rows={5}
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
          <h2 className={sectionTitle}>Your rates</h2>
          <p className="mt-1 text-sm text-gray-600">
            Changes apply to new bookings only. Existing bookings keep the rate
            they were made at. To add another trade, contact SERVORA support,
            since each trade needs its license reviewed.
          </p>
        </div>
        {trades.map((t) => (
          <div
            key={t.categoryId}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4"
          >
            <div>
              <p className="font-medium text-brand-navy">{t.name}</p>
              <p className="text-xs text-gray-500">
                Allowed range ${t.min}–${t.max}/hr
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">$</span>
              <input
                className="w-28 rounded-full border border-gray-300 bg-white px-4 py-2 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                type="number"
                step="0.5"
                value={rates[t.categoryId]}
                onChange={(e) =>
                  setRates((prev) => ({
                    ...prev,
                    [t.categoryId]: e.target.value,
                  }))
                }
                aria-label={`Hourly rate for ${t.name}`}
              />
              <span className="text-sm text-gray-500">/hr</span>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className={sectionTitle}>Weekly availability</h2>
          <p className="mt-1 text-sm text-gray-600">
            Customers see this on your profile. It&apos;s a guide, and you still
            accept or decline each request.
          </p>
        </div>
        {DAY_ORDER.map((i) => {
          const d = days[i];
          return (
            <div
              key={i}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4"
            >
              <label className="flex cursor-pointer items-center gap-3 font-medium text-brand-navy">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-brand-orange"
                  checked={d.enabled}
                  onChange={(e) => setDay(i, { enabled: e.target.checked })}
                />
                {DAY_NAMES[i]}
              </label>
              {d.enabled ? (
                <div className="flex items-center gap-2 text-sm">
                  <input
                    type="time"
                    value={d.start}
                    onChange={(e) => setDay(i, { start: e.target.value })}
                    aria-label={`${DAY_NAMES[i]} start time`}
                    className="rounded-full border border-gray-300 px-4 py-2 outline-none focus:border-brand-orange"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="time"
                    value={d.end}
                    onChange={(e) => setDay(i, { end: e.target.value })}
                    aria-label={`${DAY_NAMES[i]} end time`}
                    className="rounded-full border border-gray-300 px-4 py-2 outline-none focus:border-brand-orange"
                  />
                </div>
              ) : (
                <span className="text-sm text-gray-500">Not available</span>
              )}
            </div>
          );
        })}
      </section>

      <section className="space-y-3">
        <h2 className={sectionTitle}>New bookings</h2>
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border p-4">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-brand-orange"
            checked={accepting}
            onChange={(e) => setAccepting(e.target.checked)}
          />
          <span>
            <span className="block font-medium text-brand-navy">
              I&apos;m accepting new booking requests
            </span>
            <span className="text-sm text-gray-600">
              Turn this off when you&apos;re busy. You&apos;ll disappear from the
              browse pages, and existing bookings aren&apos;t affected.
            </span>
          </span>
        </label>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && (
        <p className="rounded-xl bg-green-50 p-4 text-sm text-green-800">
          Your profile has been saved.
        </p>
      )}

      <button type="submit" disabled={loading} className={primaryButton}>
        {loading ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}