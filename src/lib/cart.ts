import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
    if (!cart) return [];

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
    return [];
  }
}
