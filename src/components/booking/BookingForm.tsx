"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Avatar from "@/components/ui/Avatar";
import {
  inputClass,
  textareaClass,
  primaryButton,
  outlineButton,
  Label,
} from "@/components/ui/form";

type Trade = { categoryId: string; name: string; rate: number };

type Props = {
  customerId: string;
  proId: string;
  proName: string;
  avatarUrl: string | null;
  location: string;
  trades: Trade[];
  initialCategoryId?: string;
};

function money(n: number) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function BookingForm({
  customerId,
  proId,
  proName,
  avatarUrl,
  location,
  trades,
  initialCategoryId,
}: Props) {
  const supabase = createClient();

  const [categoryId, setCategoryId] = useState(
    trades.find((t) => t.categoryId === initialCategoryId)?.categoryId ??
      trades[0]?.categoryId ??
      ""
  );
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [hours, setHours] = useState("2");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const trade = trades.find((t) => t.categoryId === categoryId);
  const hoursNum = Number(hours);
  const estimate = trade && hoursNum >= 1 ? trade.rate * hoursNum : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!trade) return setError("Pick a service.");

    const start = new Date(`${date}T${time}`);
    if (!date || !time || Number.isNaN(start.getTime())) {
      return setError("Pick a date and a start time.");
    }
    if (start.getTime() < Date.now() + 2 * 60 * 60 * 1000) {
      return setError("Pick a start time at least 2 hours from now.");
    }
    if (!(hoursNum >= 1 && hoursNum <= 24)) {
      return setError("Estimated hours must be between 1 and 24.");
    }
    if (description.trim().length < 15) {
      return setError(
        "Describe the job in a bit more detail (at least 15 characters)."
      );
    }

    setLoading(true);

    // The database copies the pro's current hourly rate onto the booking itself
    const { error: insertErr } = await supabase.from("bookings").insert({
      customer_id: customerId,
      pro_id: proId,
      category_id: categoryId,
      description: description.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim().toUpperCase(),
      zip: zip.trim(),
      scheduled_start: start.toISOString(),
      estimated_hours: hoursNum,
    });

    if (insertErr) {
      console.error(insertErr);
      const known = [
        "not available for the selected category",
        "must be in the future",
        "Only customer accounts",
      ];
      setError(
        known.some((k) => insertErr.message.includes(k))
          ? insertErr.message
          : "We couldn't send your request. Please try again."
      );
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border p-8 text-center sm:p-10">
        <CheckCircle2 size={48} className="mx-auto text-green-600" />
        <h1 className="mt-4 text-3xl font-bold text-brand-navy">
          Request sent
        </h1>
        <p className="mt-3 text-gray-600">
          {proName} will review your request and confirm or decline it. You can
          track it from your dashboard.
        </p>
        <div className="mt-8 space-y-3">
          <Link href="/dashboard" className={`${primaryButton} block text-center`}>
            Go to my dashboard
          </Link>
          <Link href="/services" className={outlineButton}>
            Browse more pros
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy md:text-4xl">
            Request a booking
          </h1>
          <p className="mt-2 text-gray-600">
            Tell {proName} about the job. Sending a request is free, and nothing
            is confirmed until they accept.
          </p>
        </div>

        <section className="space-y-5">
          <h2 className="text-xl font-bold text-brand-navy">The job</h2>
          <div>
            <Label htmlFor="service" required>
              Service
            </Label>
            <div className="relative">
              <select
                id="service"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={`${inputClass} appearance-none pr-12`}
              >
                {trades.map((t) => (
                  <option key={t.categoryId} value={t.categoryId}>
                    {t.name} · ${t.rate}/hr
                  </option>
                ))}
              </select>
              <ChevronDown
                size={20}
                className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-gray-500"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="description" required>
              Describe the job
            </Label>
            <textarea
              id="description"
              className={textareaClass}
              rows={5}
              placeholder="What needs doing? Mention the size of the space, materials, access or parking, and anything else the pro should know."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="text-xl font-bold text-brand-navy">When</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="date" required>
                Date
              </Label>
              <input
                id="date"
                type="date"
                className={inputClass}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="time" required>
                Start time
              </Label>
              <input
                id="time"
                type="time"
                className={inputClass}
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="hours" required>
              Estimated hours
            </Label>
            <input
              id="hours"
              type="number"
              min={1}
              max={24}
              step="0.5"
              className={inputClass}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              required
            />
            <p className="mt-2 text-xs text-gray-500">
              Your best guess. Your pro can adjust it with you in chat.
            </p>
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="text-xl font-bold text-brand-navy">Where</h2>
          <div>
            <Label htmlFor="address" required>
              Street address
            </Label>
            <input
              id="address"
              className={inputClass}
              placeholder="123 Main St, Apt 4"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              autoComplete="street-address"
              required
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <Label htmlFor="city" required>
                City
              </Label>
              <input
                id="city"
                className={inputClass}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                autoComplete="address-level2"
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
                autoComplete="address-level1"
                required
              />
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
                autoComplete="postal-code"
                required
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Your address is only shared with {proName}, and only on this
            booking.
          </p>
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading} className={primaryButton}>
          {loading ? "Sending request..." : "Send booking request"}
        </button>
      </form>

      <aside>
        <div className="rounded-2xl border p-6 shadow-sm lg:sticky lg:top-24">
          <div className="flex items-center gap-4">
            <Avatar name={proName} src={avatarUrl} size={64} />
            <div>
              <p className="text-lg font-bold text-brand-navy">{proName}</p>
              {location && <p className="text-sm text-gray-600">{location}</p>}
            </div>
          </div>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Service</dt>
              <dd className="font-medium">{trade?.name ?? "–"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Hourly rate</dt>
              <dd className="font-medium">${trade?.rate ?? "–"}/hr</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Estimated hours</dt>
              <dd className="font-medium">{hoursNum >= 1 ? hoursNum : "–"}</dd>
            </div>
            <div className="flex justify-between border-t pt-3 text-base">
              <dt className="font-semibold">Estimated total</dt>
              <dd className="font-bold text-brand-navy">
                {estimate != null ? `$${money(estimate)}` : "–"}
              </dd>
            </div>
          </dl>

          <p className="mt-5 rounded-xl bg-gray-50 p-4 text-xs text-gray-600">
            This is an estimate. The final cost depends on the hours actually
            worked. SERVORA doesn't take payment online yet, so you and your
            pro settle up directly once the job is done.
          </p>
        </div>
      </aside>
    </div>
  );
}