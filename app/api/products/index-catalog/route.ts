import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const mlServiceUrl = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

  try {
    // 1. Fetch all products with categories from SQLite
    const products = await prisma.product.findMany({
      include: { category: true },
    });

    if (products.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No products found in database to index.",
      });
    }

    // 2. Format products for the FastAPI microservice
    const payload = {
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category?.name || "",
      })),
    };

    // 3. Send to FastAPI /index endpoint
    const res = await fetch(`${mlServiceUrl}/index`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `ML Service returned status ${res.status}: ${errText}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json({ success: true, mlResponse: data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sync catalog";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}