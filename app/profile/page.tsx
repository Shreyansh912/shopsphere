import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/navbar/Navbar";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Package, Calendar, Clock, ArrowRight, UserCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/profile");
  }

  const userId = (session.user as { id?: string }).id;

  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Profile Header */}
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900 text-white font-black text-xl">
                {session.user.name ? session.user.name[0]?.toUpperCase() : "U"}
              </div>
              <div>
                <h1 className="text-2xl font-black text-neutral-900">
                  {session.user.name || "Customer"}
                </h1>
                <p className="text-sm text-neutral-500">{session.user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700 w-fit">
              <UserCheck className="h-4 w-4 text-emerald-600" /> Verified Customer Account
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-neutral-900">Order History</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Review and track all your previous purchases
              </p>
            </div>
            <span className="text-xs font-semibold text-neutral-400">
              {orders.length} {orders.length === 1 ? "Order" : "Orders"}
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-neutral-300 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400 mb-3">
                <Package className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-neutral-900">No orders placed yet</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                Once you complete a purchase, your itemized tracking and digital receipts will show up here.
              </p>
              <div className="mt-5">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-neutral-800"
                >
                  Start Browsing <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm hover:border-neutral-300 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4 mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-neutral-900">
                          #{order.id.slice(0, 8)}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            order.status === "delivered"
                              ? "bg-emerald-100 text-emerald-700"
                              : order.status === "shipped"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-neutral-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:justify-end">
                      <div className="text-right">
                        <span className="block text-[11px] uppercase font-semibold text-neutral-400">Total</span>
                        <span className="text-base font-bold text-neutral-900">
                          {formatCurrency(order.total)}
                        </span>
                      </div>
                      <Link
                        href={`/orders/${order.id}`}
                        className="rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition"
                      >
                        Receipt
                      </Link>
                    </div>
                  </div>

                  {/* Purchased Line Items */}
                  <div className="divide-y divide-neutral-50 text-xs">
                    {order.items.map((item) => (
                      <div key={item.id} className="py-2 flex justify-between items-center text-neutral-600">
                        <span>
                          {item.product?.name || "Product Unavailable"}{" "}
                          <span className="text-neutral-400 font-semibold">× {item.quantity}</span>
                        </span>
                        <span className="font-semibold text-neutral-800">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}