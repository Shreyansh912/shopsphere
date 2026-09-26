import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/navbar/Navbar";
import ProductCard from "@/components/products/ProductCard";
import {
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, featuredProducts] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      take: 8,
      include: {
        images: true,
        category: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28 text-center px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-1.5 text-xs font-bold tracking-wider uppercase text-neutral-600">
            New Generation Marketplace
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-neutral-900 leading-[1.08]">
            Everything you need.
            <br />
            One smarter store.
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-neutral-500 font-normal leading-relaxed">
            Discover curated electronics, high-fidelity audio, and modern
            computing gear built for creators and professionals.
          </p>

          <div className="pt-2">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-7 py-4 text-sm font-bold text-white shadow-lg shadow-neutral-950/10 transition hover:bg-neutral-800 hover:scale-[1.02] active:scale-[0.98]"
            >
              Shop Catalog <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Dynamic Category Filter Pills */}
      <div className="border-y border-neutral-100 bg-neutral-50/60 py-3.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-3 overflow-x-auto no-scrollbar">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 whitespace-nowrap">
            Categories:
          </span>
          <Link
            href="/products"
            className="whitespace-nowrap rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-xs font-semibold text-neutral-700 shadow-xs transition hover:border-neutral-900 hover:text-neutral-900"
          >
            All Products
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="whitespace-nowrap rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-xs font-semibold text-neutral-700 shadow-xs transition hover:border-neutral-900 hover:text-neutral-900"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Feature Badges */}
      <section className="border-b border-neutral-100 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="flex flex-col items-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-800">
              <Truck className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-neutral-900">Free Express Delivery</h4>
            <p className="text-xs text-neutral-500 mt-1">On all orders over $100</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-800">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-neutral-900">2-Year Warranty</h4>
            <p className="text-xs text-neutral-500 mt-1">100% verified original gear</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-800">
              <RotateCcw className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-neutral-900">30-Day Easy Returns</h4>
            <p className="text-xs text-neutral-500 mt-1">Zero hassle refund policy</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-800">
              <Headphones className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-neutral-900">24/7 Dedicated Support</h4>
            <p className="text-xs text-neutral-500 mt-1">Always here to help you</p>
          </div>
        </div>
      </section>

      {/* Featured Releases Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900">
              Featured Releases
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Top-rated items handpicked for you
            </p>
          </div>

          <Link
            href="/products"
            className="group flex items-center gap-1.5 text-xs sm:text-sm font-bold text-neutral-900 hover:text-neutral-600 transition"
          >
            <span>View all products</span>
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>

        {featuredProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-neutral-300 p-12 text-center text-sm text-neutral-500">
            No products found. Run <code className="font-mono bg-neutral-100 px-1 py-0.5 rounded">npx prisma db seed</code> to seed demo items.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((p, index) => (
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
      </section>
    </div>
  );
}