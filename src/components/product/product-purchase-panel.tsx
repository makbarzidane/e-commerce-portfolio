"use client";

import { useMemo, useState, useTransition } from "react";
import { ShoppingBag, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { submitCart, toast } from "@/components/product/product-actions";

type Variant = {
  color: string;
  colorHex: string;
  material: string;
  stock: number;
  sku: string;
};

export function ProductPurchasePanel({ productSlug, materials, variants }: { productSlug: string; materials: string[]; variants: Variant[] }) {
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(variants.map((variant) => [variant.sku, 0])),
  );
  const [notice, setNotice] = useState<{ tone: "success" | "error" | "info"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const selections = useMemo(
    () => variants.map((variant) => ({ sku: variant.sku, quantity: quantities[variant.sku] ?? 0 })),
    [quantities, variants],
  );

  function setQuantity(sku: string, quantity: number, stock: number) {
    setQuantities((current) => ({
      ...current,
      [sku]: Math.min(Math.max(0, quantity), stock),
    }));
  }

  function handleSubmit(mode: "cart" | "buy") {
    const hasSelection = selections.some((selection) => selection.quantity > 0);
    if (!hasSelection) {
      const message = mode === "buy" ? "Minimal pilih 1 produk untuk melanjutkan pembelian." : "Minimal pilih 1 produk untuk menambahkan ke keranjang.";
      setNotice({ tone: "error", message });
      toast(message, "error");
      return;
    }

    startTransition(async () => {
      const result = await submitCart({ productSlug, selections, mode });
      if (result.ok) {
        const message = mode === "buy" ? "Produk siap dibeli. Membuka checkout..." : "Produk berhasil masuk keranjang.";
        setNotice({ tone: "success", message });
        toast(message);
        window.dispatchEvent(
          new CustomEvent("zimeira:cart-count", {
            detail: { delta: selections.reduce((total, selection) => total + selection.quantity, 0) },
          }),
        );
        if (mode === "buy") {
          window.location.href = "/checkout";
        }
        return;
      }

      const tone = result.code === "AUTH_REQUIRED" ? "info" : "error";
      const message = result.message ?? "Aksi belum berhasil. Coba lagi.";
      setNotice({ tone, message });
      toast(message, tone);
    });
  }

  return (
    <div className="grid gap-4">
      <div>
        <p className="mb-2 text-sm font-medium">Bahan</p>
        <div className="flex flex-wrap gap-2">
          {materials.map((material) => (
            <Badge key={material} variant="outline">{material}</Badge>
          ))}
        </div>
      </div>
      {notice ? (
        <div className={noticeClassName(notice.tone)}>
          {notice.message}
        </div>
      ) : null}
      <div className="silk-panel flex flex-col gap-4 rounded-2xl border p-4 shadow-sm">
        <div>
          <p className="font-medium">Pilih varian dan jumlah</p>
          <p className="mt-1 text-sm text-muted-foreground">Isi quantity pada satu atau beberapa varian untuk dibeli bersamaan.</p>
        </div>
        <div className="overflow-hidden rounded-2xl border bg-background/80">
          {variants.map((variant) => {
            const isAvailable = variant.stock > 0;

            return (
              <label key={variant.sku} className="grid gap-3 border-b px-4 py-3 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center">
                <span className="flex items-center gap-3">
                  <span className="size-8 rounded-full border shadow-sm" style={{ backgroundColor: variant.colorHex }} />
                  <span>
                    <span className="block text-sm font-medium">{variant.color} / {variant.material}</span>
                    <span className="text-xs text-muted-foreground">SKU {variant.sku} - Stok {variant.stock}</span>
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Qty</span>
                  <input
                    type="number"
                    min="0"
                    max={variant.stock}
                    value={quantities[variant.sku] ?? 0}
                    disabled={!isAvailable}
                    onChange={(event) => setQuantity(variant.sku, Number.parseInt(event.target.value || "0", 10), variant.stock)}
                    className="h-9 w-24 rounded-lg border border-input bg-background px-3 text-sm disabled:opacity-50"
                  />
                </span>
              </label>
            );
          })}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button type="button" size="lg" variant="outline" className="w-full" disabled={isPending} onClick={() => handleSubmit("cart")}>
            <ShoppingBag data-icon="inline-start" />
            {isPending ? "Memproses..." : "Masukkan Keranjang"}
          </Button>
          <Button type="button" size="lg" className="w-full" disabled={isPending} onClick={() => handleSubmit("buy")}>
            <Zap data-icon="inline-start" />
            {isPending ? "Memproses..." : "Beli Sekarang"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function noticeClassName(tone: "success" | "error" | "info") {
  if (tone === "error") return "rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive";
  if (tone === "info") return "rounded-2xl border border-primary/25 bg-primary/10 p-4 text-sm text-primary";
  return "rounded-2xl border bg-secondary/70 p-4 text-sm text-secondary-foreground";
}
