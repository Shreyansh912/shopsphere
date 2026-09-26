import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/navbar/Navbar";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || role !== "admin") {
    redirect("/");
  }

  const products = await prisma.product.findMany({
    include: { images: true, category: true },
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
              <span>Products</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-neutral-900">
              Stock & Inventory Control
            </h1>
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-600">
            <thead className="border-b border-neutral-100 text-xs uppercase font-bold text-neutral-400">
              <tr>
                <th className="pb-3">Product</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Price</th>
                <th className="pb-3">Stock Units</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-neutral-50/50">
                  <td className="py-4 flex items-center gap-3">
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
                      <Image
                        src={product.images[0]?.url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900">{product.name}</p>
                      <p className="text-xs text-neutral-400">{product.brand}</p>
                    </div>
                  </td>
                  <td className="py-4">{product.category?.name || "Uncategorized"}</td>
                  <td className="py-4 font-bold text-neutral-900">{formatCurrency(product.price)}</td>
                  <td className="py-4 font-bold">
                    <span className={product.stockQuantity < 5 ? "text-amber-600" : "text-neutral-900"}>
                      {product.stockQuantity} units
                    </span>
                  </td>
                  <td className="py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                      product.stockQuantity > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    }`}>
                      {product.stockQuantity > 0 ? "In Stock" : "Sold Out"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}