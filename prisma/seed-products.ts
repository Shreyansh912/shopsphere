import { PrismaClient } from "@prisma/client";
import path from "path";

// Ensure absolute database file path resolution on Windows
const dbPath = path.resolve(process.cwd(), "prisma", "dev.db");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${dbPath}`,
    },
  },
});

interface ApiProduct {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand?: string;
  sku?: string;
  thumbnail: string;
  images: string[];
}

interface ApiResponse {
  products: ApiProduct[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("Fetching 100 products from DummyJSON API...");
  const res = await fetch("https://dummyjson.com/products?limit=100");
  const data: ApiResponse = await res.json();

  console.log(`Fetched ${data.products.length} products. Grouping categories...`);

  // 1. Group unique categories from API response
  const categoryNames = [...new Set(data.products.map((p) => p.category))];

  const categoryMap = new Map<string, string>();

  for (const catName of categoryNames) {
    const slug = slugify(catName);
    const formattedName = catName
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const category = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: {
        name: formattedName,
        slug,
        description: `Explore top quality items under ${formattedName}.`,
      },
    });

    categoryMap.set(catName, category.id);
  }

  console.log(`Seeding ${data.products.length} products into the database...`);

  let count = 0;
  for (const p of data.products) {
    const categoryId = categoryMap.get(p.category);
    if (!categoryId) continue;

    const baseSlug = slugify(p.title);
    const uniqueSlug = `${baseSlug}-${p.id}`;

    const discountPrice =
      p.discountPercentage > 0
        ? Math.round(p.price * (1 - p.discountPercentage / 100) * 100) / 100
        : null;

    const imageUrls = p.images?.length > 0 ? p.images : [p.thumbnail];

    await prisma.product.upsert({
      where: { slug: uniqueSlug },
      update: {
        price: p.price,
        discountPrice,
        stockQuantity: p.stock || 20,
      },
      create: {
        sku: p.sku || `SKU-DUMMY-${p.id}`,
        name: p.title,
        slug: uniqueSlug,
        description: p.description,
        price: p.price,
        discountPrice,
        stockQuantity: p.stock || 20,
        brand: p.brand || "ShopSphere Select",
        categoryId,
        images: {
          create: imageUrls.map((url) => ({ url })),
        },
      },
    });

    count++;
  }

  console.log(`Successfully added ${count} products to your store!`);
}

main()
  .catch((e) => {
    console.error("Error populating products:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });