import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing existing data...");
  await prisma.wishlistItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  // Deleting users cascades and removes sessions and accounts automatically
  await prisma.user.deleteMany();

  console.log("Seeding accounts...");
  const hashedPassword = await bcrypt.hash("password123", 10);

  // 1. Primary Admin Account
  await prisma.user.create({
    data: {
      name: "Shreyansh Sonkar",
      email: "shreyanshsonkar59@gmail.com",
      role: "admin",
      passwordHash: hashedPassword,
    },
  });

  // 2. Default Store Admin
  await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@shopsphere.com",
      role: "admin",
      passwordHash: hashedPassword,
    },
  });

  // 3. Demo Customer Account
  const customer = await prisma.user.create({
    data: {
      name: "Alex Johnson",
      email: "alex@example.com",
      role: "customer",
      passwordHash: hashedPassword,
    },
  });

  console.log("Seeding categories...");
  const audioCategory = await prisma.category.create({
    data: {
      name: "Audio & Sound",
      slug: "audio-sound",
      description: "Premium studio headphones, wireless earbuds, and spatial sound gear.",
    },
  });

  const wearablesCategory = await prisma.category.create({
    data: {
      name: "Wearables",
      slug: "wearables",
      description: "Smart fitness trackers, titanium smartwatches, and next-gen wearables.",
    },
  });

  const computingCategory = await prisma.category.create({
    data: {
      name: "Computing & Accessories",
      slug: "computing-accessories",
      description: "Mechanical keyboards, ergonomic mice, and creator workstation essentials.",
    },
  });

  console.log("Seeding products...");
  const products = [
    {
      sku: "SKU-AURA-001",
      name: "Aura ANC Studio Headphones",
      slug: "aura-anc-studio-headphones",
      description:
        "Flagship wireless over-ear headphones featuring 45mm custom dynamic drivers, adaptive active noise cancellation, and up to 40 hours of playback.",
      price: 299.99,
      discountPrice: 249.99,
      stockQuantity: 28,
      brand: "Aura Sound",
      categoryId: audioCategory.id,
      images: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80",
      ],
    },
    {
      sku: "SKU-CHRONO-002",
      name: "Chronos Apex Smartwatch Ultra",
      slug: "chronos-apex-smartwatch-ultra",
      description:
        "Rugged aerospace-grade titanium chassis, dual-frequency GPS, 100m water resistance, and ECG heart monitoring sensor.",
      price: 499.0,
      discountPrice: 449.0,
      stockQuantity: 15,
      brand: "Chronos",
      categoryId: wearablesCategory.id,
      images: [
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
      ],
    },
    {
      sku: "SKU-VORTEX-003",
      name: "Vortex Pro Wireless Mechanical Keyboard",
      slug: "vortex-pro-wireless-mechanical-keyboard",
      description:
        "Compact 75% hot-swappable mechanical keyboard with lubricated linear switches, CNC aluminum base, and Bluetooth 5.2 connectivity.",
      price: 159.0,
      discountPrice: 139.0,
      stockQuantity: 34,
      brand: "Vortex Labs",
      categoryId: computingCategory.id,
      images: [
        "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80",
      ],
    },
    {
      sku: "SKU-SONIC-004",
      name: "SonicPulse True Wireless Earbuds",
      slug: "sonicpulse-true-wireless-earbuds",
      description:
        "Compact in-ear wireless buds with low-latency gaming mode, transparency pass-through, and wireless Qi-charging case.",
      price: 129.99,
      discountPrice: 99.99,
      stockQuantity: 50,
      brand: "Aura Sound",
      categoryId: audioCategory.id,
      images: [
        "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80",
      ],
    },
    {
      sku: "SKU-ERGO-005",
      name: "ErgoFlow Precision Wireless Mouse",
      slug: "ergoflow-precision-wireless-mouse",
      description:
        "Ergonomic vertical wireless mouse designed to alleviate wrist strain with multi-device pairing and infinite scroll wheel.",
      price: 89.99,
      discountPrice: 79.99,
      stockQuantity: 42,
      brand: "Vortex Labs",
      categoryId: computingCategory.id,
      images: [
        "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80",
      ],
    },
    {
      sku: "SKU-PULSE-006",
      name: "Apex Pulse Fitness Band",
      slug: "apex-pulse-fitness-band",
      description:
        "Lightweight fitness tracker with curved AMOLED display, SpO2 blood oxygen tracking, sleep analytics, and 14-day battery life.",
      price: 79.0,
      discountPrice: 65.0,
      stockQuantity: 60,
      brand: "Chronos",
      categoryId: wearablesCategory.id,
      images: [
        "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800&auto=format&fit=crop&q=80",
      ],
    },
    {
      sku: "SKU-STUDIO-007",
      name: "Studiocast 4K USB-C Webcam",
      slug: "studiocast-4k-usbc-webcam",
      description:
        "Ultra HD 4K streaming camera with AI auto-framing, dual noise-canceling beamforming microphones, and magnetic privacy shutter.",
      price: 179.99,
      discountPrice: 149.99,
      stockQuantity: 20,
      brand: "Vortex Labs",
      categoryId: computingCategory.id,
      images: [
        "https://images.unsplash.com/photo-1588508065123-287b28e013da?w=800&auto=format&fit=crop&q=80",
      ],
    },
    {
      sku: "SKU-SPEAKER-008",
      name: "SoundSphere Portable Bluetooth Speaker",
      slug: "soundsphere-portable-bluetooth-speaker",
      description:
        "IPX7 waterproof 360-degree portable outdoor speaker with deep bass radiators and 24-hour battery endurance.",
      price: 119.0,
      discountPrice: null,
      stockQuantity: 30,
      brand: "Aura Sound",
      categoryId: audioCategory.id,
      images: [
        "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80",
      ],
    },
  ];

  for (const item of products) {
    const { images, ...productData } = item;
    const createdProduct = await prisma.product.create({
      data: {
        ...productData,
        images: {
          create: images.map((url) => ({ url })),
        },
      },
    });

    await prisma.review.create({
      data: {
        productId: createdProduct.id,
        userId: customer.id,
        rating: 5,
        comment: `Great product, completely satisfied with the quality of ${createdProduct.name}!`,
      },
    });
  }

  console.log("Database seeded successfully with admin account and 8 products!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });