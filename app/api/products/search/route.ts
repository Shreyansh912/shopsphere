import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim() || "";
  const category = searchParams.get("category");
  const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined;
  const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;
  const sortBy = searchParams.get("sortBy") || "createdAt";

  const mlServiceUrl = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

  try {
    let mlMatchedIds: string[] = [];

    // 1. Attempt to consult FastAPI semantic search if query is provided
    if (query.length > 0) {
      try {
        const mlRes = await fetch(
          `${mlServiceUrl}/search?q=${encodeURIComponent(query)}`,
          { next: { revalidate: 30 } }
        );
        if (mlRes.ok) {
          const mlData = await mlRes.json();
          if (Array.isArray(mlData.product_ids) && mlData.product_ids.length > 0) {
            mlMatchedIds = mlData.product_ids;
          }
        }
      } catch {
        // ML microservice offline or unreachable: gracefully fall back to SQLite substring match
      }
    }

    // 2. Build where filter for Prisma
    const whereClause: Record<string, unknown> = {};

    if (category && category !== "all") {
      whereClause.category = { slug: category };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      whereClause.price = {
        ...(minPrice !== undefined ? { gte: minPrice } : {}),
        ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
      };
    }

    if (mlMatchedIds.length > 0) {
      whereClause.id = { in: mlMatchedIds };
    } else if (query.length > 0) {
      whereClause.OR = [
        { name: { contains: query } },
        { description: { contains: query } },
      ];
    }

    // 3. Build sorting order
    let orderBy: Record<string, "asc" | "desc"> = { createdAt: "desc" };
    if (sortBy === "price_asc") orderBy = { price: "asc" };
    if (sortBy === "price_desc") orderBy = { price: "desc" };

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        images: true,
        category: true,
      },
      orderBy,
      take: 40,
    });

    return NextResponse.json({
      success: true,
      count: products.length,
      usedML: mlMatchedIds.length > 0,
      products,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search query failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}