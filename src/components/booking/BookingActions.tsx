"use client";

import { useState, useTransition } from "react";
import { changeBookingStatus } from "@/app/dashboard/actions";

export type ActionDef = {
  status: "confirmed" | "declined" | "in_progress" | "completed" | "cancelled";
  label: string;
  style: "primary" | "danger" | "outline";
  askReason?: boolean;
};

const base =
  "rounded-full px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-50";
const styles = {
  primary: "bg-brand-orange text-white hover:bg-brand-orange-dark",
  danger: "border border-red-300 text-red-600 hover:bg-red-50",
  outline: "border border-gray-300 text-gray-800 hover:bg-gray-50",
};

export default function BookingActions({
  bookingId,
  actions,
}: {
  bookingId: string;
  actions: ActionDef[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [asking, setAsking] = useState<ActionDef | null>(null);
  const [reason, setReason] = useState("");

  function run(action: ActionDef, reasonText?: string) {
    setError(null);
    startTransition(async () => {
      const res = await changeBookingStatus(
        bookingId,
        action.status,
        reasonText
      );
      if (res.error) {
        setError(res.error);
        return;
      }
      setAsking(null);
      setReason("");
    });
  }

  if (actions.length === 0) return null;

  return (
    <div className="mt-5">
      {asking ? (
        <div className="space-y-3 rounded-xl bg-gray-50 p-4">
          <label
            htmlFor={`reason-${bookingId}`}
            className="block text-sm font-semibold text-brand-navy"
          >
            Reason (optional)
          </label>
          <textarea
            id={`reason-${bookingId}`}
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Let them know why"
            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-brand-orange"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => run(asking, reason)}
              className={`${base} ${styles.danger}`}
            >
              {isPending ? "Working..." : `Yes, ${asking.label.toLowerCase()}`}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setAsking(null);
                setReason("");
              }}
              className={`${base} ${styles.outline}`}
            >
              Back
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {actions.map((a) => (
            <button
              key={a.status}
              type="button"
              disabled={isPending}
              onClick={() => (a.askReason ? setAsking(a) : run(a))}
              className={`${base} ${styles[a.style]}`}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}