"use client";

import { useState, useTransition } from "react";
import { Heart, ShoppingBag, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CartButtonProps = {
  productSlug: string;
  variantSku: string;
  mode?: "cart" | "buy";
  variant?: "default" | "outline";
  className?: string;
};

export function AddToCartButton({ productSlug, variantSku, mode = "cart", variant = "outline", className }: CartButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const Icon = mode === "buy" ? Zap : ShoppingBag;

  function handleClick() {
    startTransition(async () => {
      const result = await submitCart({
        productSlug,
        mode,
        selections: [{ sku: variantSku, quantity: 1 }],
      });

      if (result.ok) {
        setAdded(true);
        toast(mode === "buy" ? "Produk siap dibeli." : "Produk berhasil masuk keranjang.");
        window.dispatchEvent(new CustomEvent("zimeira:cart-count", { detail: { delta: 1 } }));
        if (mode === "buy") {
          window.location.href = "/checkout";
        }
        return;
      }

      toast(result.message ?? "Aksi belum berhasil. Coba lagi.", "error");
    });
  }

  return (
    <Button type="button" variant={added ? "secondary" : variant} className={className} disabled={isPending} onClick={handleClick}>
      <Icon data-icon="inline-start" />
      {isPending ? "..." : mode === "buy" ? "Beli" : added ? "Ditambahkan" : "Keranjang"}
    </Button>
  );
}

export function WishlistToggleButton({
  productSlug,
  initialWishlisted,
  className,
  iconOnly = false,
}: {
  productSlug: string;
  initialWishlisted?: boolean;
  className?: string;
  iconOnly?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [wishlisted, setWishlisted] = useState(Boolean(initialWishlisted));

  function handleClick() {
    startTransition(async () => {
      const response = await fetch("/api/wishlist/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productSlug }),
      });
      const payload = await response.json().catch(() => null) as { ok?: boolean; wishlisted?: boolean; message?: string } | null;

      if (response.ok && payload?.ok) {
        const wasWishlisted = wishlisted;
        setWishlisted(Boolean(payload.wishlisted));
        if (Boolean(payload.wishlisted) !== wasWishlisted) {
          window.dispatchEvent(new CustomEvent("zimeira:wishlist-count", { detail: { delta: payload.wishlisted ? 1 : -1 } }));
        }
        toast(payload.wishlisted ? "Produk berhasil ditambahkan ke wishlist." : "Produk berhasil dihapus dari wishlist.", payload.wishlisted ? "success" : "info");
        return;
      }

      toast(payload?.message ?? "Login diperlukan untuk wishlist.", "info");
    });
  }

  return (
    <Button
      type="button"
      variant={wishlisted ? "default" : "outline"}
      size={iconOnly ? "icon-sm" : "lg"}
      aria-pressed={wishlisted}
      aria-label={wishlisted ? "Hapus dari wishlist" : "Tambah wishlist"}
      title={wishlisted ? "Sudah di wishlist" : "Tambah wishlist"}
      className={cn(iconOnly && "rounded-full shadow-sm shadow-primary/20", className)}
      disabled={isPending}
      onClick={handleClick}
    >
      <Heart data-icon={iconOnly ? "only" : "inline-start"} className={wishlisted ? "fill-current" : ""} />
      {iconOnly ? null : wishlisted ? "Sudah di Wishlist" : "Tambah Wishlist"}
    </Button>
  );
}

export async function submitCart({
  productSlug,
  selections,
  mode,
}: {
  productSlug: string;
  selections: Array<{ sku: string; quantity: number }>;
  mode: "cart" | "buy";
}) {
  if (!selections.some((selection) => selection.quantity > 0)) {
    return {
      ok: false,
      code: "MIN_QTY",
      message: mode === "buy" ? "Minimal pilih 1 produk untuk melanjutkan pembelian." : "Minimal pilih 1 produk untuk menambahkan ke keranjang.",
    };
  }

  const response = await fetch("/api/cart/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productSlug, selections, mode }),
  });
  const payload = await response.json().catch(() => null) as { ok?: boolean; code?: string; message?: string } | null;

  if (response.ok && payload?.ok) return { ok: true };
  if (payload?.code === "AUTH_REQUIRED") {
    return { ok: false, code: "AUTH_REQUIRED", message: "Login atau buat akun terlebih dahulu untuk melanjutkan pembelian." };
  }

  return { ok: false, code: payload?.code ?? "FAILED", message: payload?.message ?? "Aksi belum berhasil. Coba lagi." };
}

export function toast(message: string, tone: "success" | "error" | "info" = "success") {
  window.dispatchEvent(new CustomEvent("zimeira:toast", { detail: { message, tone } }));
}
