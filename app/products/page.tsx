import { prisma } from "@/lib/prisma";
import Navbar from "@/components/navbar/Navbar";
import ProductCard from "@/components/products/ProductCard";
import Link from "next/link";
import { Search } from "lucide-react";
import { Prisma } from "@prisma/client";

interface ProductsPageProps {
  searchParams: Promise<{
    query?: string;
    category?: string;
    sort?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { query, category, sort } = await searchParams;

  // Build dynamic Prisma query filter
  const whereClause: Prisma.ProductWhereInput = {};

  if (query && query.trim() !== "") {
    const cleanQuery = query.trim();
    whereClause.OR = [
      { name: { contains: cleanQuery } },
      { description: { contains: cleanQuery } },
      { brand: { contains: cleanQuery } },
    ];
  }

  if (category) {
    whereClause.category = { slug: category };
  }

  // Dynamic sorting
  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
  if (sort === "price-low") {
    orderBy = { price: "asc" };
  } else if (sort === "price-high") {
    orderBy = { price: "desc" };
  }

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: whereClause,
      include: { images: true, category: true },
      orderBy,
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header & In-Page Search */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-neutral-200 pb-8 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-neutral-900">
              Product Catalog
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Explore high-performance electronics, audio equipment, and devices
            </p>
          </div>

          <form method="GET" action="/products" className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              name="query"
              defaultValue={query || ""}
              placeholder="Search by name, brand, or specs..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-900 shadow-sm"
            />
            {category && <input type="hidden" name="category" value={category} />}
            {sort && <input type="hidden" name="sort" value={sort} />}
          </form>
        </div>

        {/* Filters and Sorting Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
            <Link
              href={`/products${sort ? `?sort=${sort}` : ""}`}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                !category
                  ? "bg-neutral-900 text-white"
                  : "bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-900"
              }`}
            >
              All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}${sort ? `&sort=${sort}` : ""}${
                  query ? `&query=${encodeURIComponent(query)}` : ""
                }`}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  category === cat.slug
                    ? "bg-neutral-900 text-white"
                    : "bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-900"
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-600">
            <span>Sort by:</span>
            <Link
              href={`/products?${new URLSearchParams({
                ...(query ? { query } : {}),
                ...(category ? { category } : {}),
                sort: "price-low",
              }).toString()}`}
              className={`px-2.5 py-1 rounded-lg border transition ${
                sort === "price-low"
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              Price: Low to High
            </Link>
            <Link
              href={`/products?${new URLSearchParams({
                ...(query ? { query } : {}),
                ...(category ? { category } : {}),
                sort: "price-high",
              }).toString()}`}
              className={`px-2.5 py-1 rounded-lg border transition ${
                sort === "price-high"
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              Price: High to Low
            </Link>
          </div>
        </div>

        {/* Results Banner when Search Term is Active */}
        {query && (
          <div className="mb-6 flex items-center justify-between rounded-2xl bg-neutral-100 px-5 py-3 text-xs text-neutral-600">
            <span>
              Showing results for: <strong className="text-neutral-900">&quot;{query}&quot;</strong> ({products.length} found)
            </span>
            <Link
              href={`/products${category ? `?category=${category}` : ""}${sort ? `&sort=${sort}` : ""}`}
              className="font-bold text-neutral-900 hover:underline"
            >
              Clear search
            </Link>
          </div>
        )}

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-neutral-300 bg-white p-12 text-center">
            <h3 className="text-base font-bold text-neutral-900">No matching products found</h3>
            <p className="text-xs text-neutral-500 mt-1">
              Try searching with different keywords, product names, or clearing active filters.
            </p>
            <div className="mt-5">
              <Link
                href="/products"
                className="inline-block rounded-xl bg-neutral-900 px-5 py-2 text-xs font-bold text-white hover:bg-neutral-800 transition"
              >
                Clear all filters
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p, index) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                slug={p.slug}
                brand={p.brand}
                price={p.price}
                discountPrice={p.discountPrice}
                stock={p.stockQuantity}
                priority={index < 4}
                imageUrl={
                  p.images[0]?.url ||
                  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"
                }
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}