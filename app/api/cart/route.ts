import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Safe interface contract matching Prisma schema without using `any`
interface PrismaWithCart {
  cart: {
    findUnique: (args: unknown) => Promise<{
      id: string;
      userId: string;
      items: Array<{
        id: string;
        productId: string;
        quantity: number;
        product: {
          id: string;
          name: string;
          price: number;
          discountPrice: number | null;
          images: Array<{ url: string }>;
        };
      }>;
    } | null>;
    create: (args: unknown) => Promise<{ id: string; userId: string }>;
  };
  cartItem: {
    deleteMany: (args: unknown) => Promise<{ count: number }>;
    upsert: (args: unknown) => Promise<unknown>;
  };
}

const db = prisma as unknown as PrismaWithCart;

// GET /api/cart - Fetch current user's persistent cart
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ items: [] });
    }

    const cart = await db.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: { images: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ items: cart?.items || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error fetching cart";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/cart - Update item quantity or remove item
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      productId?: string;
      quantity?: number;
    };

    const { productId, quantity } = body;

    if (!productId || typeof quantity !== "number") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    let cart = await db.cart.findUnique({ where: { userId } });
    if (!cart) {
      const newCart = await db.cart.create({ data: { userId } });
      cart = { id: newCart.id, userId: newCart.userId, items: [] };
    }

    if (quantity <= 0) {
      await db.cartItem.deleteMany({
        where: { cartId: cart.id, productId },
      });
    } else {
      await db.cartItem.upsert({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId,
          },
        },
        update: { quantity },
        create: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    const updated = await db.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: {
              include: { images: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ items: updated?.items || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update cart";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}