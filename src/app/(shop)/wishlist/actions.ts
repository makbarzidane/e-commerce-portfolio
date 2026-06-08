"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { setFlashToast } from "@/lib/flash-toast";
import { getPrisma } from "@/lib/prisma";

export async function toggleWishlist(formData: FormData) {
  const session = await getServerSession(authOptions);
  const productSlug = String(formData.get("productSlug") ?? "");
  const returnTo = await getSafeReturnTo(String(formData.get("returnTo") ?? ""), productSlug);

  if (!session?.user?.id) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(returnTo)}`);
  }

  try {
    const product = await getPrisma().product.findUnique({ where: { slug: productSlug } });
    if (!product) return;

    const existing = await getPrisma().wishlist.findUnique({
      where: { userId_productId: { userId: session.user.id, productId: product.id } },
    });

    if (existing) {
      await getPrisma().wishlist.delete({ where: { id: existing.id } });
      await setFlashToast("Produk berhasil dihapus dari wishlist.", "info");
    } else {
      await getPrisma().wishlist.create({
        data: { userId: session.user.id, productId: product.id },
      });
      await setFlashToast("Produk berhasil ditambahkan ke wishlist.");
    }
  } catch {
    return;
  }

  revalidatePath("/produk");
  revalidatePath(`/produk/${productSlug}`);
  revalidatePath("/");
  revalidatePath("/wishlist");
  revalidatePath("/akun");
  redirect(returnTo);
}

async function getSafeReturnTo(value: string, productSlug: string) {
  const fallback = productSlug ? `/produk/${productSlug}` : "/wishlist";
  const headerStore = await headers();
  const referer = headerStore.get("referer");
  const candidate = value.trim() || getPathFromReferer(referer) || fallback;

  if (!candidate.startsWith("/") || candidate.startsWith("//")) return fallback;

  return stripWishlistStatus(candidate);
}

function getPathFromReferer(referer: string | null) {
  if (!referer) return null;

  try {
    const url = new URL(referer);
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

function stripWishlistStatus(path: string) {
  const [pathname, query = ""] = path.split("?");
  if (!query) return pathname;

  const params = new URLSearchParams(query);
  params.delete("wishlist");
  const nextQuery = params.toString();
  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}
