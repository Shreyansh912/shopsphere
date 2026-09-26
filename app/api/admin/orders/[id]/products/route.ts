import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;

    if (!session || role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const body = (await req.json()) as {
      name?: string;
      sku?: string;
      brand?: string;
      price?: string | number;
      discountPrice?: string | number;
      stockQuantity?: string | number;
      description?: string;
      categoryId?: string;
      imageUrl?: string;
    };

    const {
      name,
      sku,
      brand,
      price,
      discountPrice,
      stockQuantity,
      description,
      categoryId,
      imageUrl,
    } = body;

    if (!name || !sku || !brand || !price || !categoryId) {
      return NextResponse.json(
        { error: "Name, SKU, Brand, Price, and Category are required." },
        { status: 400 }
      );
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const newProduct = await prisma.product.create({
      data: {
        name,
        slug: `${slug}-${Date.now().toString().slice(-4)}`,
        sku,
        brand,
        price: typeof price === "string" ? parseFloat(price) : price,
        discountPrice:
          discountPrice !== undefined && discountPrice !== ""
            ? typeof discountPrice === "string"
              ? parseFloat(discountPrice)
              : discountPrice
            : null,
        stockQuantity:
          stockQuantity !== undefined
            ? typeof stockQuantity === "string"
              ? parseInt(stockQuantity, 10)
              : stockQuantity
            : 0,
        description: description || "",
        categoryId,
        images: imageUrl
          ? {
              create: [{ url: imageUrl }],
            }
          : undefined,
      },
    });

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error: unknown) {
    console.error("Admin product action error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}