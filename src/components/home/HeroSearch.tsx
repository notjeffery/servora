"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const services = [
  { name: "Painting", slug: "painting" },
  { name: "Plumbing", slug: "plumbing" },
  { name: "HVAC", slug: "hvac" },
  { name: "Drywall", slug: "drywall" },
  { name: "General Construction", slug: "general-construction" },
];

export default function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    const match = q
      ? services.find((s) => s.name.toLowerCase() === q) ??
        services.find(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            q.includes(s.name.toLowerCase())
        )
      : undefined;
    router.push(match ? `/services/${match.slug}` : "/services");
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="flex w-full max-w-2xl overflow-hidden rounded-full bg-white shadow-lg"
    >
      <input
        list="service-options"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="What do you need help with?"
        aria-label="What do you need help with?"
        className="min-w-0 flex-1 bg-transparent px-6 py-4 text-gray-900 outline-none placeholder:text-gray-500"
      />
      <datalist id="service-options">
        {services.map((s) => (
          <option key={s.slug} value={s.name} />
        ))}
      </datalist>
      <button
        type="submit"
        aria-label="Search"
        className="flex items-center justify-center bg-brand-orange px-6 text-white transition-colors hover:bg-brand-orange-dark"
      >
        <Search size={22} />
      </button>
    </form>
  );
}