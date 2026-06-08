import { getServerSession } from "next-auth";
import { categories as fallbackCategories, products as fallbackProducts, type products } from "@/lib/data";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type StoreProduct = (typeof products)[number] & { isWishlisted?: boolean };
export type StoreCategory = (typeof fallbackCategories)[number];

const labelMap: Record<string, string> = {
  NEW_ARRIVAL: "new arrival",
  BEST_SELLER: "best seller",
  DISCOUNT: "diskon",
};

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: true;
    images: true;
    variants: true;
  };
}>;

export function mapProduct(product: ProductWithRelations): StoreProduct {
  const variants = product.variants.map((variant) => ({
    color: variant.color,
    colorHex: variant.colorHex ?? "#eadbd2",
    material: variant.material,
    stock: variant.stock,
    sku: variant.sku,
  }));

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.category.name,
    categorySlug: product.category.slug,
    description: product.description,
    normalPrice: product.normalPrice,
    discountPrice: product.discountPrice,
    image: product.images[0]?.url ?? "/images/products/pashmina-rose.svg",
    labels: product.labels.map((label: string) => labelMap[label] ?? label.toLowerCase()),
    colors: Array.from(new Set(variants.map((variant) => variant.color))),
    materials: Array.from(new Set(variants.map((variant) => variant.material))),
    variants,
  };
}

export async function getStoreCategories(): Promise<StoreCategory[]> {
  try {
    const categories = await getPrisma().productCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { name: true, slug: true, description: true },
    });

    if (!categories.length) return fallbackCategories;

    return categories.map((category) => ({
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
    }));
  } catch {
    return fallbackCategories;
  }
}

export async function getStoreProducts(): Promise<StoreProduct[]> {
  try {
    const products = await getPrisma().product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!products.length) return fallbackProducts;

    return products.map(mapProduct);
  } catch {
    return fallbackProducts;
  }
}

export async function getStoreProductsForCurrentCustomer(): Promise<StoreProduct[]> {
  const products = await getStoreProducts();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !products.length) return products;

  try {
    const wishlist = await getPrisma().wishlist.findMany({
      where: { userId: session.user.id, productId: { in: products.map((product) => product.id) } },
      select: { productId: true },
    });
    const wishlistIds = new Set(wishlist.map((item) => item.productId));
    return products.map((product) => ({ ...product, isWishlisted: wishlistIds.has(product.id) }));
  } catch {
    return products;
  }
}

export async function getStoreProductBySlug(slug: string): Promise<StoreProduct | null> {
  try {
    const product = await getPrisma().product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!product || !product.isActive) {
      return fallbackProducts.find((item) => item.slug === slug) ?? null;
    }

    return mapProduct(product);
  } catch {
    return fallbackProducts.find((item) => item.slug === slug) ?? null;
  }
}
