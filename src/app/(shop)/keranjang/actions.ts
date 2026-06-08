"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrCreateCart } from "@/lib/cart";
import { getPrisma } from "@/lib/prisma";

function toPositiveInt(value: FormDataEntryValue | null, fallback = 1) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

function toSelectionQuantity(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

function readVariantSelections(formData: FormData) {
  const skus = formData
    .getAll("variantSku")
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);

  return skus.map((sku) => ({
    sku,
    quantity: formData.has(`quantity:${sku}`)
      ? toSelectionQuantity(formData.get(`quantity:${sku}`))
      : toPositiveInt(formData.get("quantity")),
  }));
}

export async function addToCart(formData: FormData) {
  const productSlug = String(formData.get("productSlug") ?? "");
  await addProductSelectionsToCart(formData, `/produk/${productSlug}?cart=added`);
}

export async function buyNow(formData: FormData) {
  await addProductSelectionsToCart(formData, "/checkout");
}

async function addProductSelectionsToCart(formData: FormData, successTarget: string) {
  const session = await getServerSession(authOptions);
  const productSlug = String(formData.get("productSlug") ?? "");
  const selections = readVariantSelections(formData);
  let target: string = successTarget;

  if (!session?.user?.id) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(`/produk/${productSlug}`)}`);
  }

  try {
    const cart = await getOrCreateCart(true);
    if (!cart) throw new Error("Cart tidak bisa dibuat.");
    const product = await getPrisma().product.findUnique({
      where: { slug: productSlug },
      include: { variants: true },
    });

    if (!product) {
      target = `/produk/${productSlug}?error=product-not-found`;
      throw new Error("PRODUCT_NOT_FOUND");
    }

    const requestedSelections = selections.length ? selections : [{ sku: product.variants[0]?.sku ?? "", quantity: 1 }];
    const validSelections = requestedSelections
      .map((selection) => ({
        ...selection,
        variant: product.variants.find((item) => item.sku === selection.sku),
      }))
      .filter((selection) => selection.variant && selection.quantity > 0);

    if (!validSelections.length) {
      target = `/produk/${productSlug}?error=stock`;
      throw new Error("STOCK_UNAVAILABLE");
    }

    const price = product.discountPrice ?? product.normalPrice;

    for (const selection of validSelections) {
      const variant = selection.variant;
      if (!variant?.isActive || variant.stock < 1) continue;

      const safeQuantity = Math.min(selection.quantity, variant.stock);
      const existingItem = await getPrisma().cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId: product.id,
          variantId: variant.id,
        },
      });

      if (existingItem) {
        const nextQuantity = Math.min(existingItem.quantity + safeQuantity, variant.stock);
        await getPrisma().cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: nextQuantity, price },
        });
      } else {
        await getPrisma().cartItem.create({
          data: {
            cartId: cart.id,
            productId: product.id,
            variantId: variant.id,
            quantity: safeQuantity,
            price,
          },
        });
      }
    }
  } catch (error) {
    if ((error as Error).message !== "PRODUCT_NOT_FOUND" && (error as Error).message !== "STOCK_UNAVAILABLE") {
      target = `/produk/${productSlug}?error=cart-database`;
    }
  }

  revalidatePath("/keranjang");
  revalidatePath("/checkout");
  redirect(target);
}

export async function updateCartQuantity(formData: FormData) {
  const session = await getServerSession(authOptions);
  const id = String(formData.get("id") ?? "");
  const quantity = toPositiveInt(formData.get("quantity"));
  if (!id) return;

  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/keranjang");
  }

  try {
    const cart = await getOrCreateCart();
    if (!cart) return;

    const item = await getPrisma().cartItem.findFirst({
      where: { id, cartId: cart.id },
      include: { variant: true },
    });
    if (!item) return;

    const safeQuantity = item.variant ? Math.min(quantity, Math.max(1, item.variant.stock)) : quantity;

    await getPrisma().cartItem.updateMany({
      where: { id, cartId: cart.id },
      data: { quantity: safeQuantity },
    });
  } catch {
    return;
  }

  revalidatePath("/keranjang");
}

export async function removeCartItem(formData: FormData) {
  const session = await getServerSession(authOptions);
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/keranjang");
  }

  try {
    const cart = await getOrCreateCart();
    if (!cart) return;

    await getPrisma().cartItem.deleteMany({ where: { id, cartId: cart.id } });
  } catch {
    return;
  }

  revalidatePath("/keranjang");
}
