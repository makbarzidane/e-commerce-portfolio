import Image from "next/image";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProductPurchasePanel } from "@/components/product/product-purchase-panel";
import { WishlistToggleButton } from "@/components/product/product-actions";
import { products } from "@/lib/data";
import { authOptions } from "@/lib/auth";
import { formatCurrency, getDiscountPercent } from "@/lib/format";
import { getPrisma } from "@/lib/prisma";
import { getStoreProductBySlug } from "@/lib/store-data";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ cart?: string; wishlist?: string; error?: string; auth?: string }>;
}) {
  const { slug } = await params;
  const status = await searchParams;
  const product = await getStoreProductBySlug(slug);
  if (!product) notFound();

  const price = product.discountPrice ?? product.normalPrice;
  const discount = getDiscountPercent(product.normalPrice, product.discountPrice);
  const session = await getServerSession(authOptions);
  const wishlistItem = session?.user?.id
    ? await getPrisma().wishlist.findFirst({
        where: { userId: session.user.id, productId: product.id },
        select: { id: true },
      }).catch(() => null)
    : null;
  const isWishlisted = Boolean(wishlistItem);
  const reviews = await getPrisma().review.findMany({
    where: { productId: product.id, isVisible: true },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { user: { select: { name: true } } },
  }).catch(() => []);
  const averageRating = reviews.length ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length : 0;

  return (
    <section className="brand-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[520px_1fr] lg:px-8">
      <Card className="motion-card overflow-hidden rounded-2xl shadow-xl shadow-primary/10">
        <CardContent className="p-0">
          <Image src={product.image} alt={product.name} width={900} height={1100} className="aspect-[4/5] w-full object-cover" />
        </CardContent>
      </Card>
      <div className="animate-fade-up flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {discount > 0 ? <Badge>{discount}% off</Badge> : null}
            {product.labels.map((label) => (
              <Badge key={label} variant="secondary" className="capitalize">{label}</Badge>
            ))}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{product.name}</h1>
          <p className="text-muted-foreground">{product.description}</p>
          <div>
            <p className="text-2xl font-semibold">{formatCurrency(price)}</p>
            {product.discountPrice ? <p className="text-muted-foreground line-through">{formatCurrency(product.normalPrice)}</p> : null}
          </div>
        </div>
        <StatusNotice cart={status.cart} wishlist={status.wishlist} error={status.error} auth={status.auth} />
        <Separator />
        <ProductPurchasePanel productSlug={product.slug} materials={product.materials} variants={product.variants} />
        <WishlistToggleButton productSlug={product.slug} initialWishlisted={isWishlisted} />
        <section className="grid gap-3 rounded-2xl border bg-card/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold">Review Customer</p>
              <p className="text-sm text-muted-foreground">
                {reviews.length ? `${averageRating.toFixed(1)} / 5 dari ${reviews.length} review` : "Belum ada review untuk produk ini."}
              </p>
            </div>
            {reviews.length ? <Badge variant="secondary">{"★".repeat(Math.round(averageRating))}</Badge> : null}
          </div>
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border bg-background/70 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{review.user.name ?? "Customer"}</p>
                <p className="text-sm text-primary">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
              </div>
              {review.comment ? <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p> : null}
            </div>
          ))}
        </section>
      </div>
      </div>
    </section>
  );
}

function StatusNotice({ cart, wishlist, error, auth }: { cart?: string; wishlist?: string; error?: string; auth?: string }) {
  if (cart === "added") {
    return <Notice>Produk berhasil ditambahkan ke keranjang. Kamu bisa tambah varian lain tanpa pindah halaman.</Notice>;
  }
  if (auth === "required") {
    return (
      <Notice tone="info">
        Untuk lanjut membeli, silakan login atau buat akun terlebih dahulu. Produk tetap bisa kamu masukkan ke keranjang sebagai guest.
      </Notice>
    );
  }
  if (wishlist === "added") {
    return <Notice>Produk berhasil ditambahkan ke wishlist.</Notice>;
  }
  if (wishlist === "removed") {
    return <Notice>Produk dihapus dari wishlist.</Notice>;
  }
  if (error === "stock") {
    return <Notice tone="error">Pilih minimal satu varian dengan stok tersedia.</Notice>;
  }
  if (error) {
    return <Notice tone="error">Aksi belum berhasil. Coba lagi beberapa saat lagi.</Notice>;
  }
  return null;
}

function Notice({ children, tone = "success" }: { children: React.ReactNode; tone?: "success" | "error" | "info" }) {
  if (tone === "info") {
    return <div className="rounded-2xl border border-primary/25 bg-primary/10 p-4 text-sm text-primary">{children}</div>;
  }

  return (
    <div className={tone === "error" ? "rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive" : "rounded-2xl border bg-secondary/70 p-4 text-sm text-secondary-foreground"}>
      {children}
    </div>
  );
}
