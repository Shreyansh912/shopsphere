import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/navbar/Navbar";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || role !== "admin") {
    redirect("/");
  }

  const orders = await prisma.order.findMany({
    include: {
      items: { include: { product: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-neutral-50/50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
              <Link href="/admin" className="hover:underline">Admin</Link>
              <span>/</span>
              <span>Orders</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-neutral-900">
              Order Fulfillment
            </h1>
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
          {orders.length === 0 ? (
            <p className="text-sm text-neutral-500 py-8 text-center">No customer orders available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-600">
                <thead className="border-b border-neutral-100 text-xs uppercase font-bold text-neutral-400">
                  <tr>
                    <th className="pb-3">Order Details</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Products</th>
                    <th className="pb-3">Total</th>
                    <th className="pb-3">Status Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-neutral-50/50">
                      <td className="py-4">
                        <p className="font-mono font-semibold text-neutral-900">{order.id.slice(0, 10)}</p>
                        <p className="text-xs text-neutral-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="py-4">
                        <p className="font-semibold text-neutral-800">{order.user?.name || "Guest"}</p>
                        <p className="text-xs text-neutral-400">{order.user?.email || "No email"}</p>
                      </td>
                      <td className="py-4">
                        <div className="space-y-1">
                          {order.items.map((i) => (
                            <p key={i.id} className="text-xs text-neutral-700">
                              {i.product?.name || "Product Unavailable"} <span className="text-neutral-400">×{i.quantity}</span>
                            </p>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 font-bold text-neutral-900">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="py-4">
                        <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
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