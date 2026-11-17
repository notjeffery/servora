"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { inputClass, primaryButton, Label } from "@/components/ui/form";

type Trade = { categoryId: string; name: string; rate: number };

type Props = {
  proId: string;
  trades: Trade[];
  initialCategoryId?: string;
};

export default function BookingCard({
  proId,
  trades,
  initialCategoryId,
}: Props) {
  const [categoryId, setCategoryId] = useState(
    trades.find((t) => t.categoryId === initialCategoryId)?.categoryId ??
      trades[0]?.categoryId ??
      ""
  );
  const trade = trades.find((t) => t.categoryId === categoryId);

  return (
    <div className="rounded-2xl border p-6 shadow-sm">
      <p className="text-3xl font-bold text-brand-navy">
        ${trade?.rate ?? "–"}
        <span className="text-base font-normal text-gray-600"> /hr</span>
      </p>

      <div className="mt-5">
        <Label htmlFor="trade">Service</Label>
        <div className="relative">
          <select
            id="trade"
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

      <Link
        href={`/book/${proId}?category=${categoryId}`}
        className={`${primaryButton} mt-5 block text-center`}
      >
        Request booking
      </Link>
      <p className="mt-3 text-center text-sm text-gray-500">
        Sending a request is free. Your pro will confirm the details.
      </p>
    </div>
  );
}