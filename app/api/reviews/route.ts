import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createReviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(3, "Comment must be at least 3 characters"),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;

    if (!session || !userId) {
      return NextResponse.json(
        { error: "You must be signed in to submit a review." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const result = createReviewSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid review data." },
        { status: 400 }
      );
    }

    const { productId, rating, comment } = result.data;

    // Check product existence
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    // Upsert or create new review
    const review = await prisma.review.create({
      data: {
        productId,
        userId,
        rating,
        comment,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Failed to post review:", error);
    return NextResponse.json(
      { error: "Failed to post review. Please try again." },
      { status: 500 }
    );
  }
}