import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface SimilarProductsProps {
  productId: string;
}

type ProductWithImages = Prisma.ProductGetPayload<{
  include: { images: true };
}> & {
  similarity: number;
};

export default async function SimilarProducts({ productId }: SimilarProductsProps) {
  let similarProducts: ProductWithImages[] = [];

  try {
    const res = await fetch(`http://localhost:8000/similar/${productId}?top_k=4`, {
      cache: "no-store",
    });

    if (res.ok) {
      const data = (await res.json()) as {
        similar: Array<{ productId: string; similarity: number }>;
      };

      const productIds = data.similar.map((item) => item.productId);

      const dbProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: { images: true },
      });

      similarProducts = data.similar
        .map((item) => {
          const prod = dbProducts.find((p) => p.id === item.productId);
          if (!prod) return null;
          return {
            ...prod,
            similarity: item.similarity,
          };
        })
        .filter((p): p is ProductWithImages => p !== null);
    }
  } catch (error) {
    console.error("Failed to fetch visually similar products:", error);
    return null;
  }

  if (similarProducts.length === 0) return null;

  return (
    <section className="mt-16 border-t border-gray-100 pt-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">
            Visually Similar Items
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Ranked by ResNet-18 feature extraction & cosine similarity
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {similarProducts.map((item) => (
          <Link
            key={item.id}
            href={`/products/${item.slug}`}
            className="group block border border-gray-200 rounded-xl p-3 bg-white hover:shadow-md transition"
          >
            <div className="relative aspect-square w-full mb-3 bg-slate-50 rounded-lg overflow-hidden">
              <span className="absolute top-2 right-2 z-10 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                {Math.round(item.similarity * 100)}% Match
              </span>
              {item.images?.[0]?.url && (
                <Image
                  src={item.images[0].url}
                  alt={item.name}
                  fill
                  className="object-cover group-hover:scale-105 transition duration-200"
                />
              )}
            </div>
            <h3 className="text-xs font-semibold text-gray-900 truncate">
              {item.name}
            </h3>
            <p className="text-xs font-bold text-slate-800 mt-1">
              ₹{(item.discountPrice ?? item.price).toFixed(2)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}