"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const services = [
  "Painting",
  "Plumbing",
  "HVAC",
  "Drywall",
  "General Construction",
];

export default function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: send to the browse page (with ?q=query) once it exists
    router.push("/signup");
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
          <option key={s} value={s} />
        ))}
      </datalist>
      <button
        type="submit"
        aria-label="Search"
        className="flex items-center justify-center bg-orange-500 px-6 text-white transition-colors hover:bg-orange-600"
      >
        <Search size={22} />
      </button>
    </form>
  );
}