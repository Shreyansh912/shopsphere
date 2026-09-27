import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface GuestCartItem {
  productId: string;
  quantity: number;
}

interface CartItemEntity {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
}

interface CartRecord {
  id: string;
  userId: string;
  items: CartItemEntity[];
}

interface PrismaWithCartSync {
  cart: {
    findUnique: (args: unknown) => Promise<CartRecord | null>;
    create: (args: unknown) => Promise<CartRecord>;
  };
  cartItem: {
    update: (args: unknown) => Promise<unknown>;
    create: (args: unknown) => Promise<unknown>;
  };
}

const db = prisma as unknown as PrismaWithCartSync;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { guestItems?: GuestCartItem[] };
    const guestItems: GuestCartItem[] = Array.isArray(body?.guestItems)
      ? body.guestItems
      : [];

    let cart = await db.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart) {
      cart = await db.cart.create({
        data: { userId },
        include: { items: true },
      });
    }

    // Merge each guest item
    if (guestItems.length > 0) {
      for (const item of guestItems) {
        if (!item?.productId || typeof item?.quantity !== "number" || item.quantity <= 0) {
          continue;
        }

        const existing = cart.items.find(
          (cartItem: CartItemEntity) => cartItem.productId === item.productId
        );

        if (existing) {
          await db.cartItem.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + item.quantity },
          });
        } else {
          await db.cartItem.create({
            data: {
              cartId: cart.id,
              productId: item.productId,
              quantity: item.quantity,
            },
          });
        }
      }
    }

    const mergedCart = await db.cart.findUnique({
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

    return NextResponse.json({
      success: true,
      items: mergedCart?.items || [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to sync cart";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}