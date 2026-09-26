import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/navbar/Navbar";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { DollarSign, ShoppingBag, Users, AlertTriangle, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || role !== "admin") {
    redirect("/");
  }

  const [orders, totalCustomers, products] = await Promise.all([
    prisma.order.findMany({
      include: {
        items: { include: { product: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where: { role: "customer" } }),
    prisma.product.findMany(),
  ]);

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const lowStockCount = products.filter((p) => p.stockQuantity < 5).length;
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-neutral-900">
              Admin Overview
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Live marketplace telemetry, transactions, and inventory status
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/orders"
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-100"
            >
              Manage Orders
            </Link>
            <Link
              href="/admin/products"
              className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Inventory
            </Link>
          </div>
        </div>

        {/* Telemetry Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Total Revenue</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-2xl font-black text-neutral-900">{formatCurrency(totalRevenue)}</p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Total Orders</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <ShoppingBag className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-2xl font-black text-neutral-900">{orders.length}</p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Customers</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-2xl font-black text-neutral-900">{totalCustomers}</p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Low Stock Alert</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-2xl font-black text-amber-600">{lowStockCount} items</p>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="mt-10 rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-neutral-900">Recent Customer Transactions</h2>
            <Link href="/admin/orders" className="text-xs font-semibold text-neutral-900 hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-sm text-neutral-500 py-6 text-center">No orders recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-600">
                <thead className="border-b border-neutral-100 text-xs uppercase font-bold text-neutral-400">
                  <tr>
                    <th className="pb-3">Order ID</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-neutral-50/50">
                      <td className="py-4 font-mono font-semibold text-neutral-900">
                        {order.id.slice(0, 8)}...
                      </td>
                      <td className="py-4">
                        {order.user?.name || "Guest Customer"}
                      </td>
                      <td className="py-4">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                          order.status === "delivered"
                            ? "bg-emerald-100 text-emerald-700"
                            : order.status === "shipped"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 text-right font-bold text-neutral-900">
                        {formatCurrency(order.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}