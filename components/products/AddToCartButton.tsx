"use client";

import { useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import { ShoppingBag, Check } from "lucide-react";

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    stockQuantity: number;
  };
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    if (product.stockQuantity <= 0) return;

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      stock: product.stockQuantity, // Supplies the required stock property
      quantity: 1,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const isOutOfStock = product.stockQuantity <= 0;

  return (
    <button
      onClick={handleAdd}
      disabled={isOutOfStock}
      className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer ${
        isOutOfStock
          ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
          : added
          ? "bg-emerald-600 text-white"
          : "bg-neutral-900 text-white hover:bg-neutral-800"
      }`}
    >
      {isOutOfStock ? (
        "Out of Stock"
      ) : added ? (
        <>
          <Check className="h-5 w-5" /> Added to Cart!
        </>
      ) : (
        <>
          <ShoppingBag className="h-5 w-5" /> Add to Cart
        </>
      )}
    </button>
  );
}