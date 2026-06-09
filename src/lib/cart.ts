import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { products as fallbackProducts } from "@/lib/data";
import { getPrisma } from "@/lib/prisma";

export type CartLine = {
  id: string;
  product: {
    id: string;
    name: string;
    slug: string;
    image: string;
    normalPrice: number;
    discountPrice: number | null;
  };
  variant: {
    id: string | null;
    color: string;
    material: string;
    sku: string;
    stock: number;
    isActive: boolean;
  };
  quantity: number;
  price: number;
};

type DemoCartItem = {
  productSlug: string;
  variantSku: string;
  quantity: number;
};

const demoCartCookie = "zimeira_demo_cart";

export async function getCartSessionId(canSetCookie = false) {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get("cart_session_id")?.value;

  if (!sessionId && canSetCookie) {
    sessionId = crypto.randomUUID();
    cookieStore.set("cart_session_id", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return sessionId;
}

export async function getOrCreateCart(canSetCookie = false) {
  const session = await getServerSession(authOptions);
  const sessionId = await getCartSessionId(canSetCookie);

  if (!session?.user?.id && !sessionId) {
    return null;
  }

  const where = session?.user?.id ? { userId: session.user.id } : { sessionId };
  const existingCart = await getPrisma().cart.findFirst({ where });
  if (existingCart) return existingCart;

  return getPrisma().cart.create({
    data: session?.user?.id ? { userId: session.user.id, sessionId } : { sessionId },
  });
}

export async function getCartLines(): Promise<CartLine[]> {
  try {
    const cart = await getOrCreateCart();
    if (!cart) return getDemoCartLines();

    const items = await getPrisma().cartItem.findMany({
      where: { cartId: cart.id },
      orderBy: { createdAt: "desc" },
      include: {
        product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
        variant: true,
      },
    });

    if (!items.length) return [];

    return items.map((item) => ({
      id: item.id,
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        image: item.product.images[0]?.url ?? "/images/products/pashmina-rose.svg",
        normalPrice: item.product.normalPrice,
        discountPrice: item.product.discountPrice,
      },
      variant: {
        id: item.variant?.id ?? null,
        color: item.variant?.color ?? "-",
        material: item.variant?.material ?? "-",
        sku: item.variant?.sku ?? "-",
        stock: item.variant?.stock ?? 0,
        isActive: item.variant?.isActive ?? false,
      },
      quantity: item.quantity,
      price: item.price,
    }));
  } catch {
    return getDemoCartLines();
  }
}

export async function addDemoCartSelections(
  productSlug: string,
  selections: Array<{ sku: string; quantity: number }>,
) {
  const product = fallbackProducts.find((item) => item.slug === productSlug);
  if (!product) return false;

  const validSelections = selections
    .map((selection) => ({
      ...selection,
      variant: product.variants.find((variant) => variant.sku === selection.sku),
    }))
    .filter((selection) => selection.variant && selection.quantity > 0);

  if (!validSelections.length) return false;

  const cookieStore = await cookies();
  const current = readDemoCart(cookieStore.get(demoCartCookie)?.value);

  for (const selection of validSelections) {
    const variant = selection.variant;
    if (!variant || variant.stock < 1) continue;

    const existing = current.find((item) => item.productSlug === productSlug && item.variantSku === variant.sku);
    const safeQuantity = Math.min(selection.quantity, variant.stock);

    if (existing) {
      existing.quantity = Math.min(existing.quantity + safeQuantity, variant.stock);
    } else {
      current.push({ productSlug, variantSku: variant.sku, quantity: safeQuantity });
    }
  }

  cookieStore.set(demoCartCookie, JSON.stringify(current), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });

  return true;
}

export async function updateDemoCartItem(id: string, quantity: number) {
  const [productSlug, variantSku] = id.split(":");
  if (!productSlug || !variantSku) return false;

  const cookieStore = await cookies();
  const current = readDemoCart(cookieStore.get(demoCartCookie)?.value);
  const item = current.find((entry) => entry.productSlug === productSlug && entry.variantSku === variantSku);
  if (!item) return false;

  const product = fallbackProducts.find((entry) => entry.slug === productSlug);
  const variant = product?.variants.find((entry) => entry.sku === variantSku);
  item.quantity = Math.min(Math.max(1, quantity), variant?.stock ?? quantity);

  cookieStore.set(demoCartCookie, JSON.stringify(current), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });

  return true;
}

export async function removeDemoCartItem(id: string) {
  const [productSlug, variantSku] = id.split(":");
  if (!productSlug || !variantSku) return false;

  const cookieStore = await cookies();
  const current = readDemoCart(cookieStore.get(demoCartCookie)?.value);
  const next = current.filter((entry) => !(entry.productSlug === productSlug && entry.variantSku === variantSku));
  if (next.length === current.length) return false;

  cookieStore.set(demoCartCookie, JSON.stringify(next), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });

  return true;
}

export async function clearDemoCart() {
  const cookieStore = await cookies();
  cookieStore.set(demoCartCookie, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

async function getDemoCartLines(): Promise<CartLine[]> {
  const cookieStore = await cookies();
  const items = readDemoCart(cookieStore.get(demoCartCookie)?.value);

  return items.flatMap((item) => {
    const product = fallbackProducts.find((entry) => entry.slug === item.productSlug);
    const variant = product?.variants.find((entry) => entry.sku === item.variantSku);
    if (!product || !variant) return [];

    const price = product.discountPrice ?? product.normalPrice;

    return {
      id: `${product.slug}:${variant.sku}`,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        image: product.image,
        normalPrice: product.normalPrice,
        discountPrice: product.discountPrice,
      },
      variant: {
        id: null,
        color: variant.color,
        material: variant.material,
        sku: variant.sku,
        stock: variant.stock,
        isActive: true,
      },
      quantity: Math.min(item.quantity, variant.stock),
      price,
    };
  });
}

function readDemoCart(value?: string): DemoCartItem[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as DemoCartItem[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => ({
        productSlug: String(item.productSlug ?? ""),
        variantSku: String(item.variantSku ?? ""),
        quantity: Math.max(1, Number.parseInt(String(item.quantity ?? "1"), 10) || 1),
      }))
      .filter((item) => item.productSlug && item.variantSku);
  } catch {
    return [];
  }
}
