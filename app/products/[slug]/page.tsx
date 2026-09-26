import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import AddToCartButton from "@/components/products/AddToCartButton";
import SimilarProducts from "@/components/products/SimilarProducts";
import ReviewSection from "@/components/products/ReviewSection";

interface ProductPageProps {
  params: Promise<{ slug: string }> | { slug: string };
}

type ProductWithDetails = Prisma.ProductGetPayload<{
  include: {
    images: true;
    category: true;
    reviews: {
      include: {
        user: {
          select: { name: true; image: true };
        };
      };
    };
  };
}>;

export async function generateMetadata({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const product = await prisma.product.findUnique({
    where: { slug: resolvedParams.slug },
    select: { name: true, description: true },
  });

  if (!product) return { title: "Product Not Found | ShopSphere" };

  return {
    title: `${product.name} | ShopSphere`,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const resolvedParams = await params;

  const product: ProductWithDetails | null = await prisma.product.findUnique({
    where: { slug: resolvedParams.slug },
    include: {
      images: true,
      category: true,
      reviews: {
        include: {
          user: {
            select: { name: true, image: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product) {
    notFound();
  }

  const primaryImage = product.images?.[0]?.url || "/placeholder-product.png";
  const displayPrice = product.discountPrice ?? product.price;
  const hasDiscount = product.discountPrice !== null && product.discountPrice < product.price;

  const averageRating =
    product.reviews.length > 0
      ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
      : 0;

  const productStock =
    "stockQuantity" in product && typeof (product as Record<string, unknown>).stockQuantity === "number"
      ? ((product as Record<string, unknown>).stockQuantity as number)
      : "stock" in product && typeof (product as Record<string, unknown>).stock === "number"
      ? ((product as Record<string, unknown>).stock as number)
      : 10;

  const cartProduct = {
    id: product.id,
    name: product.name,
    price: displayPrice,
    image: primaryImage,
    stockQuantity: productStock,
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Product Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14">
          
          {/* Product Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square w-full bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <Image
                src={primaryImage}
                alt={product.name}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {hasDiscount && (
                <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                  Sale
                </span>
              )}
            </div>

            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img) => (
                  <div
                    key={img.id}
                    className="relative w-20 h-20 flex-shrink-0 border border-slate-200 rounded-lg overflow-hidden bg-slate-50"
                  >
                    <Image
                      src={img.url}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Purchasing Info */}
          <div className="flex flex-col">
            {product.category && (
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-2">
                {product.category.name}
              </span>
            )}

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {product.name}
            </h1>

            {/* Price Display */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                ₹{displayPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-base text-gray-400 line-through">
                  ₹{product.price.toFixed(2)}
                </span>
              )}
            </div>

            {/* Rating Summary */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex items-center text-amber-400 text-sm">
                {"★".repeat(Math.round(averageRating))}
                {"☆".repeat(5 - Math.round(averageRating))}
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {averageRating > 0 ? averageRating.toFixed(1) : "No reviews yet"} ({product.reviews.length} {product.reviews.length === 1 ? "review" : "reviews"})
              </span>
            </div>

            {/* Description */}
            <p className="mt-6 text-sm text-gray-600 leading-relaxed border-t border-slate-100 pt-6">
              {product.description}
            </p>

            {/* Availability */}
            <div className="mt-6 flex items-center justify-between text-xs">
              <span className="text-gray-500">Availability</span>
              {productStock > 0 ? (
                <span className="font-semibold text-emerald-600">
                  In Stock ({productStock} units left)
                </span>
              ) : (
                <span className="font-semibold text-rose-600">Out of Stock</span>
              )}
            </div>

            {/* Add to Cart Button */}
            <div className="mt-6">
              <AddToCartButton product={cartProduct} />
            </div>

            {/* Trust Badges */}
            <div className="mt-8 border-t border-slate-100 pt-6 grid grid-cols-3 gap-2 text-center text-gray-500 text-xs">
              <div className="flex flex-col items-center gap-1.5 p-2 bg-slate-50 rounded-lg">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <span>Free Worldwide Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-2 bg-slate-50 rounded-lg">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>2-Year Full Warranty</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-2 bg-slate-50 rounded-lg">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>30-Day Easy Returns</span>
              </div>
            </div>

          </div>
        </div>

        {/* Visually Similar Products Section */}
        <SimilarProducts productId={product.id} />

        {/* Customer Reviews Section */}
        <div className="mt-16 border-t border-slate-100 pt-10">
          <ReviewSection
            productId={product.id}
            reviews={product.reviews}
          />
        </div>

      </main>
    </div>
  );
}