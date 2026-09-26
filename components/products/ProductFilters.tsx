"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export default function ProductFilters({
  categories,
}: {
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentCategory = searchParams.get("category") || "";
  const currentSort = searchParams.get("sort") || "newest";
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    startTransition(() => {
      router.push(`/products?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam("q", searchTerm.trim());
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
        <input
          type="text"
          placeholder="Search laptops, audio, accessories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-neutral-300 py-2 pl-10 pr-4 text-sm outline-none transition focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
        />
        <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-neutral-400" />
      </form>

      {/* Category & Sorting Selectors */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={currentCategory}
          onChange={(e) => updateParam("category", e.target.value)}
          className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 outline-none focus:border-neutral-900"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={currentSort}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 outline-none focus:border-neutral-900"
        >
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
        </select>

        {isPending && <span className="text-xs text-neutral-400">Updating...</span>}
      </div>
    </div>
  );
}