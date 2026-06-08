import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { products as fallbackProducts } from "@/lib/data";
import { getPrisma } from "@/lib/prisma";

const demoWishlistCookie = "zimeira_demo_wishlist";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ ok: false, code: "AUTH_REQUIRED", message: "Login diperlukan untuk wishlist." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null) as { productSlug?: string } | null;
  const productSlug = String(payload?.productSlug ?? "").trim();
  if (!productSlug) {
    return Response.json({ ok: false, code: "PRODUCT_REQUIRED" }, { status: 400 });
  }

  try {
    const product = await getPrisma().product.findUnique({ where: { slug: productSlug } });
    if (!product) throw new Error("PRODUCT_NOT_FOUND");

    const existing = await getPrisma().wishlist.findUnique({
      where: { userId_productId: { userId: session.user.id, productId: product.id } },
    });

    if (existing) {
      await getPrisma().wishlist.delete({ where: { id: existing.id } });
      return Response.json({ ok: true, wishlisted: false });
    }

    await getPrisma().wishlist.create({
      data: { userId: session.user.id, productId: product.id },
    });
    return Response.json({ ok: true, wishlisted: true });
  } catch {
    const knownProduct = fallbackProducts.some((product) => product.slug === productSlug);
    if (!knownProduct) {
      return Response.json({ ok: false, code: "PRODUCT_NOT_FOUND" }, { status: 404 });
    }

    const cookieStore = await cookies();
    const current = readDemoWishlist(cookieStore.get(demoWishlistCookie)?.value);
    const exists = current.includes(productSlug);
    const next = exists ? current.filter((slug) => slug !== productSlug) : [...current, productSlug];

    cookieStore.set(demoWishlistCookie, JSON.stringify(next), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return Response.json({ ok: true, wishlisted: !exists });
  }
}

function readDemoWishlist(value?: string) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as string[];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}
