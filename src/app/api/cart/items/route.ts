import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addDemoCartSelections, getOrCreateCart, removeDemoCartItem, updateDemoCartItem } from "@/lib/cart";
import { getPrisma } from "@/lib/prisma";

type CartSelection = {
  sku: string;
  quantity: number;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const payload = await request.json().catch(() => null) as {
    productSlug?: string;
    selections?: CartSelection[];
    mode?: "cart" | "buy";
  } | null;

  const productSlug = String(payload?.productSlug ?? "").trim();
  const selections = normalizeSelections(payload?.selections ?? []);

  if (!productSlug || !selections.length) {
    return Response.json({ ok: false, code: "MIN_QTY", message: "Minimal pilih 1 produk." }, { status: 400 });
  }

  if (payload?.mode === "buy" && !session?.user?.id) {
    return Response.json({ ok: false, code: "AUTH_REQUIRED", message: "Login diperlukan untuk melanjutkan pembelian." }, { status: 401 });
  }

  try {
    const cart = await getOrCreateCart(true);
    if (!cart) throw new Error("CART_UNAVAILABLE");

    const product = await getPrisma().product.findUnique({
      where: { slug: productSlug },
      include: { variants: true },
    });

    if (!product) throw new Error("PRODUCT_NOT_FOUND");

    const validSelections = selections
      .map((selection) => ({
        ...selection,
        variant: product.variants.find((variant) => variant.sku === selection.sku),
      }))
      .filter((selection) => selection.variant && selection.quantity > 0);

    if (!validSelections.length) {
      return Response.json({ ok: false, code: "MIN_QTY", message: "Minimal pilih 1 produk." }, { status: 400 });
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
        await getPrisma().cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: Math.min(existingItem.quantity + safeQuantity, variant.stock),
            price,
          },
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

    return Response.json({ ok: true, code: "ADDED" });
  } catch {
    const saved = await addDemoCartSelections(productSlug, selections);
    if (!saved) {
      return Response.json({ ok: false, code: "CART_FAILED", message: "Produk belum bisa ditambahkan." }, { status: 500 });
    }

    return Response.json({ ok: true, code: "ADDED_DEMO" });
  }
}

export async function PATCH(request: Request) {
  const payload = await request.json().catch(() => null) as { id?: string; quantity?: number } | null;
  const id = String(payload?.id ?? "");
  const quantity = Math.max(0, Number.parseInt(String(payload?.quantity ?? "0"), 10) || 0);

  if (!id) {
    return Response.json({ ok: false, code: "ITEM_REQUIRED" }, { status: 400 });
  }

  try {
    const cart = await getOrCreateCart();
    if (!cart) throw new Error("CART_UNAVAILABLE");

    if (quantity < 1) {
      await getPrisma().cartItem.deleteMany({ where: { id, cartId: cart.id } });
      return Response.json({ ok: true, removed: true });
    }

    const item = await getPrisma().cartItem.findFirst({
      where: { id, cartId: cart.id },
      include: { variant: true },
    });
    if (!item) throw new Error("ITEM_NOT_FOUND");

    await getPrisma().cartItem.update({
      where: { id },
      data: { quantity: item.variant ? Math.min(quantity, Math.max(1, item.variant.stock)) : quantity },
    });

    return Response.json({ ok: true });
  } catch {
    const ok = quantity < 1 ? await removeDemoCartItem(id) : await updateDemoCartItem(id, quantity);
    return Response.json({ ok, removed: quantity < 1 });
  }
}

export async function DELETE(request: Request) {
  const payload = await request.json().catch(() => null) as { id?: string } | null;
  const id = String(payload?.id ?? "");

  if (!id) {
    return Response.json({ ok: false, code: "ITEM_REQUIRED" }, { status: 400 });
  }

  try {
    const cart = await getOrCreateCart();
    if (!cart) throw new Error("CART_UNAVAILABLE");
    await getPrisma().cartItem.deleteMany({ where: { id, cartId: cart.id } });
    return Response.json({ ok: true, removed: true });
  } catch {
    const ok = await removeDemoCartItem(id);
    return Response.json({ ok, removed: ok });
  }
}

function normalizeSelections(selections: CartSelection[]) {
  return selections
    .map((selection) => ({
      sku: String(selection.sku ?? "").trim(),
      quantity: Math.max(0, Number.parseInt(String(selection.quantity ?? "0"), 10) || 0),
    }))
    .filter((selection) => selection.sku && selection.quantity > 0);
}
