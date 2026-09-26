"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useCartStore } from "@/store/useCartStore";
import { formatCurrency } from "@/lib/utils";
import Navbar from "@/components/navbar/Navbar";
import { ShieldCheck, Lock, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

const emptySubscribe = () => () => {};
function useIsHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const isHydrated = useIsHydrated();
  const { items, getSubtotal, clearCart } = useCartStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [address, setAddress] = useState({
    fullName: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-neutral-50/50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center text-sm text-neutral-500">
          Loading checkout...
        </div>
      </div>
    );
  }

  const subtotal = getSubtotal();
  const tax = Number((subtotal * 0.08).toFixed(2));
  const shipping = subtotal > 100 || subtotal === 0 ? 0 : 10;
  const total = subtotal + tax + shipping;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create Razorpay order on server with shipping address included
      const res = await fetch("/api/checkout/razorpay/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
          shippingAddress: address,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initialize payment.");

      // 2. Open Razorpay Checkout popup
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: "ShopSphere",
        description: "Payment for order",
        order_id: data.razorpayOrderId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler: async function (response: any) {
          // 3. Verify payment signature on server
          const verifyRes = await fetch("/api/checkout/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: data.orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyRes.ok && verifyData.success) {
            clearCart();
            router.push(`/orders/${data.orderId}`);
          } else {
            setError(verifyData.error || "Payment verification failed.");
            setLoading(false);
          }
        },
        prefill: {
          name: address.fullName,
        },
        theme: {
          color: "#0a0a0a",
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
      setLoading(false);
    }
  };

  const inputStyle = {
    color: "#0f172a",
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "14px",
    width: "100%",
    boxSizing: "border-box" as const,
    outline: "none",
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50/50">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-20 text-center">
          <div className="rounded-3xl border border-neutral-200 bg-white p-12 shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400 mb-4">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900">Your cart is empty</h2>
            <p className="mt-2 text-sm text-neutral-500">
              Add some products to your cart before proceeding to checkout.
            </p>
            <div className="mt-6">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"
              >
                Browse Products <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-black tracking-tight text-neutral-900 mb-8">
          Checkout
        </h1>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Shipping Form */}
          <div className="lg:col-span-7 rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-neutral-800" /> Shipping Information
            </h2>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                Recipient Full Name
              </label>
              <input
                type="text"
                required
                style={inputStyle}
                placeholder="e.g. Rahul Sharma"
                value={address.fullName}
                onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                Street Address
              </label>
              <input
                type="text"
                required
                style={inputStyle}
                placeholder="Flat 204, Green Heights"
                value={address.street}
                onChange={(e) => setAddress({ ...address, street: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  City
                </label>
                <input
                  type="text"
                  required
                  style={inputStyle}
                  placeholder="Hyderabad"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  State
                </label>
                <input
                  type="text"
                  required
                  style={inputStyle}
                  placeholder="Telangana"
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Postal Code
                </label>
                <input
                  type="text"
                  required
                  style={inputStyle}
                  placeholder="502285"
                  value={address.postalCode}
                  onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Country
                </label>
                <input
                  type="text"
                  required
                  style={inputStyle}
                  value={address.country}
                  onChange={(e) => setAddress({ ...address, country: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Checkout Review */}
          <div className="lg:col-span-5 rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-neutral-900 border-b border-neutral-100 pb-4">
              Review & Pay
            </h2>

            <div className="divide-y divide-neutral-100 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-semibold text-neutral-900 line-clamp-1">{item.name}</p>
                    <p className="text-xs text-neutral-500">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-bold text-neutral-900">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-neutral-200 pt-4 space-y-2 text-sm text-neutral-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-neutral-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span className="font-semibold text-neutral-900">{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className="font-semibold text-neutral-900">
                  {shipping === 0 ? "Free" : formatCurrency(shipping)}
                </span>
              </div>
              <div className="border-t border-neutral-200 pt-3 flex justify-between text-base font-bold text-neutral-950">
                <span>Total Due</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
            >
              <Lock className="h-4 w-4" />
              {loading ? "Processing..." : `Pay with Razorpay (${formatCurrency(total)})`}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}