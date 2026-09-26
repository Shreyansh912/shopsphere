"use client";

import { useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import { ShoppingBag, Check } from "lucide-react";

interface ProductActionsProps {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl: string;
}

export default function ProductDetailActions({
  id,
  name,
  price,
  stock,
  imageUrl,
}: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    addItem({
      id,
      name,
      price,
      image: imageUrl,
      quantity,
      stock,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="mt-8 space-y-4">
      {stock > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-neutral-700">Quantity:</span>
          <div className="flex items-center rounded-xl border border-neutral-300">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3 py-1.5 text-sm font-semibold hover:bg-neutral-100"
            >
              -
            </button>
            <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
              className="px-3 py-1.5 text-sm font-semibold hover:bg-neutral-100"
            >
              +
            </button>
          </div>
          <span className="text-xs text-neutral-400">({stock} available)</span>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={handleAddToCart}
          disabled={stock <= 0}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
        >
          {added ? (
            <>
              <Check className="h-4 w-4" /> Added to Cart!
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" /> {stock > 0 ? "Add to Cart" : "Out of Stock"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}