"use client";

import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/useCartStore";
import { formatCurrency } from "@/lib/utils";
import Navbar from "@/components/navbar/Navbar";
import { Trash2, ShoppingBag, ArrowRight, Plus, Minus } from "lucide-react";
import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};
function useIsHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, getSubtotal } = useCartStore();
  const isHydrated = useIsHydrated();

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-neutral-50/50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-neutral-500">
          Loading your cart...
        </div>
      </div>
    );
  }

  const subtotal = getSubtotal();
  const tax = Number((subtotal * 0.08).toFixed(2));
  const shipping = subtotal > 100 || subtotal === 0 ? 0 : 10;
  const total = subtotal + tax + shipping;

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-neutral-900">
              Shopping Cart
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Review and manage items before proceeding to checkout
            </p>
          </div>

          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition cursor-pointer"
            >
              Clear Cart
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="my-12 rounded-3xl border border-dashed border-neutral-300 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-neutral-900">Your cart is empty</h2>
            <p className="mt-1 text-sm text-neutral-500 max-w-sm mx-auto">
              Looks like you haven&apos;t added anything to your cart yet. Discover something new today.
            </p>
            <div className="mt-6">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"
              >
                Start Shopping <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Items List */}
            <div className="lg:col-span-8 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative aspect-square h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900 text-sm line-clamp-1">
                        {item.name}
                      </h3>
                      <p className="mt-1 text-sm font-bold text-neutral-900">
                        {formatCurrency(item.price)}
                      </p>
                    </div>
                  </div>

                  {/* Quantity and Actions */}
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6">
                    <div className="flex items-center rounded-xl border border-neutral-300">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-2.5 py-1 text-neutral-600 hover:bg-neutral-100 transition rounded-l-xl cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-neutral-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-2.5 py-1 text-neutral-600 hover:bg-neutral-100 transition rounded-r-xl cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <span className="text-sm font-bold text-neutral-900 min-w-[70px] text-right">
                      {formatCurrency(item.price * item.quantity)}
                    </span>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-neutral-400 hover:text-rose-600 transition cursor-pointer"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-4 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-neutral-900 pb-4 border-b border-neutral-100">
                Order Summary
              </h2>

              <div className="mt-4 space-y-3 text-sm text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-neutral-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax (8%)</span>
                  <span className="font-semibold text-neutral-900">{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-semibold text-neutral-900">
                    {shipping === 0 ? "Free" : formatCurrency(shipping)}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-[11px] text-neutral-400">
                    Add {formatCurrency(100 - subtotal)} more for free delivery
                  </p>
                )}
                <div className="border-t border-neutral-200 pt-4 flex justify-between text-base font-bold text-neutral-950">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href="/checkout"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"
                >
                  Proceed to Checkout <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}