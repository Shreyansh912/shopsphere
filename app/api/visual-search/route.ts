import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided." },
        { status: 400 }
      );
    }

    // Forward image to the FastAPI inference microservice
    const fastApiFormData = new FormData();
    fastApiFormData.append("file", file);

    const response = await fetch("http://localhost:8000/search?top_k=8", {
      method: "POST",
      body: fastApiFormData,
    });

    if (!response.ok) {
      throw new Error("FastAPI inference service failed");
    }

    const { matches } = (await response.json()) as {
      matches: Array<{ productId: string; similarity: number }>;
    };

    const productIds: string[] = matches.map((m) => m.productId);

    // Fetch full product models from Prisma database
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      include: {
        images: true,
        category: true,
      },
    });

    // Preserve ranking order from similarity scores with strict non-null typing
    const orderedProducts = productIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is (typeof products)[number] => Boolean(p));

    return NextResponse.json({ products: orderedProducts });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process visual search";
    console.error("Visual search error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}