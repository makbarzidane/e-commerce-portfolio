import Image from "next/image";
import Link from "next/link";
import { Eye } from "lucide-react";
import { AddToCartButton, WishlistToggleButton } from "@/components/product/product-actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatCurrency, getDiscountPercent } from "@/lib/format";
import type { StoreProduct } from "@/lib/store-data";

export function ProductCard({ product }: { product: StoreProduct; wishlistReturnTo?: string }) {
  const price = product.discountPrice ?? product.normalPrice;
  const discount = getDiscountPercent(product.normalPrice, product.discountPrice);
  const featuredLabel = product.labels.find((label) => label !== "diskon");
  const isWishlisted = Boolean(product.isWishlisted);
  const defaultVariant = product.variants.find((variant) => variant.stock > 0) ?? product.variants[0];

  return (
    <Card className="motion-card group overflow-hidden rounded-2xl border-border/80 bg-card shadow-sm">
      <Link href={`/produk/${product.slug}`} className="relative block aspect-[1/1.05] overflow-hidden bg-[linear-gradient(145deg,var(--muted),#fffaf6)]">
        <Image src={product.image} alt={product.name} fill className="object-contain p-8 transition duration-500 group-hover:scale-105 sm:p-9" sizes="(max-width: 768px) 50vw, 25vw" />
        <div className="pointer-events-none absolute inset-x-5 bottom-5 h-14 rounded-full bg-foreground/10 blur-2xl opacity-35 transition group-hover:opacity-55" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.72),transparent_34%),linear-gradient(180deg,transparent,rgba(155,104,112,0.08))]" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {discount > 0 ? <Badge>{discount}% off</Badge> : null}
          {featuredLabel ? (
            <Badge variant="secondary" className="capitalize">
              {featuredLabel}
            </Badge>
          ) : null}
        </div>
      </Link>
      <CardContent className="flex min-h-44 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/produk/${product.slug}`} className="line-clamp-2 font-semibold leading-5 hover:text-primary">
              {product.name}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">{product.category}</p>
          </div>
          <WishlistToggleButton productSlug={product.slug} initialWishlisted={isWishlisted} iconOnly className={isWishlisted ? "ring-2 ring-primary/15" : ""} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {product.variants.slice(0, 4).map((variant) => (
            <span
              key={variant.sku}
              className="size-4 rounded-full border shadow-sm ring-2 ring-background"
              style={{ backgroundColor: variant.colorHex }}
              title={variant.color}
            />
          ))}
        </div>
        <div className="mt-auto">
          <p className="font-semibold text-foreground">{formatCurrency(price)}</p>
          {product.discountPrice ? (
            <p className="text-sm text-muted-foreground line-through">{formatCurrency(product.normalPrice)}</p>
          ) : null}
        </div>
      </CardContent>
      <CardFooter className="grid gap-2 border-t bg-muted/35 p-3">
        {defaultVariant ? (
          <div className="grid grid-cols-2 gap-2">
            <AddToCartButton productSlug={product.slug} variantSku={defaultVariant.sku} variant="outline" className="w-full rounded-xl px-2 text-xs sm:text-sm" />
            <AddToCartButton productSlug={product.slug} variantSku={defaultVariant.sku} mode="buy" variant="default" className="w-full rounded-xl px-2 text-xs sm:text-sm" />
          </div>
        ) : null}
        <Link href={`/produk/${product.slug}`} className={buttonVariants({ variant: "secondary", className: "w-full rounded-xl shadow-sm shadow-primary/10" })}>
          <Eye data-icon="inline-start" />
          Lihat Detail
        </Link>
      </CardFooter>
    </Card>
  );
}
