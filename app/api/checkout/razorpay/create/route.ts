import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import { z } from "zod";

const createOrderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      quantity: z.number().min(1),
    })
  ).min(1),
  shippingAddress: z.object({
    fullName: z.string().min(2),
    street: z.string().min(3),
    city: z.string().min(2),
    state: z.string().min(2),
    postalCode: z.string().min(3),
    country: z.string().min(2),
  }),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;

    const body = await req.json();
    const result = createOrderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid checkout payload." }, { status: 400 });
    }

    const { items, shippingAddress } = result.data;
    const productIds = items.map((i) => i.id);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    let subtotal = 0;
    const orderItemsData = [];

    for (const item of items) {
      const dbProduct = products.find((p) => p.id === item.id);
      if (!dbProduct || dbProduct.stockQuantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for "${dbProduct?.name || item.id}"` },
          { status: 400 }
        );
      }

      const unitPrice = dbProduct.discountPrice ?? dbProduct.price;
      subtotal += unitPrice * item.quantity;

      orderItemsData.push({
        productId: item.id,
        name: dbProduct.name,
        quantity: item.quantity,
        price: unitPrice,
      });
    }

    const tax = Number((subtotal * 0.08).toFixed(2));
    const shipping = subtotal > 100 ? 0 : 10;
    const total = subtotal + tax + shipping;

    // Save pending order with serialized shippingAddress
    const order = await prisma.order.create({
      data: {
        userId: userId || null,
        shippingAddress: JSON.stringify(shippingAddress),
        status: "pending",
        paymentStatus: "unpaid",
        subtotal,
        tax,
        total,
        items: {
          create: orderItemsData,
        },
      },
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: "INR",
      receipt: order.id,
    });

    return NextResponse.json({
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    return NextResponse.json(
      { error: "Could not create payment order." },
      { status: 500 }
    );
  }
}