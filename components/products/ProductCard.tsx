"use client";

import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { ShoppingBag } from "lucide-react";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  discountPrice?: number | null;
  stock: number;
  imageUrl: string;
  priority?: boolean;
}

export default function ProductCard({
  id,
  name,
  slug,
  brand,
  price,
  discountPrice,
  stock,
  imageUrl,
  priority = false,
}: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  const effectivePrice = discountPrice ?? price;
  const isOutOfStock = stock <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock) return;

    addItem({
      id,
      name,
      price: effectivePrice,
      image: imageUrl,
      stock,
      quantity: 1,
    });
  };

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-3 sm:p-4 shadow-sm transition hover:shadow-md hover:border-neutral-300">
      <div>
        {/* Product Image Frame */}
        <Link
          href={`/products/${slug}`}
          className="relative block aspect-square w-full overflow-hidden rounded-xl bg-neutral-100"
        >
          {discountPrice && (
            <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
              Sale
            </span>
          )}

          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            priority={priority}
            className="object-cover object-center transition duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Product Details */}
        <div className="mt-3.5 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            {brand}
          </p>
          <Link href={`/products/${slug}`}>
            <h3 className="line-clamp-1 text-sm font-semibold text-neutral-900 group-hover:text-neutral-600 transition">
              {name}
            </h3>
          </Link>
        </div>
      </div>

      {/* Pricing & Cart Action */}
      <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
        <div className="flex flex-col">
          <span className="text-sm font-extrabold text-neutral-900">
            {formatCurrency(effectivePrice)}
          </span>
          {discountPrice && (
            <span className="text-xs text-neutral-400 line-through">
              {formatCurrency(price)}
            </span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer ${
            isOutOfStock
              ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
              : "bg-neutral-900 text-white hover:bg-neutral-800 active:scale-95"
          }`}
          title={isOutOfStock ? "Out of Stock" : "Add to Cart"}
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          <span>{isOutOfStock ? "Sold Out" : "Add"}</span>
        </button>
      </div>
    </div>
  );
}