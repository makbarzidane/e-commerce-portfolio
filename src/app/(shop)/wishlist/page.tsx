import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentCustomer, getCustomerWishlist } from "@/lib/customer-data";

export default async function WishlistPage() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    redirect("/auth/login?callbackUrl=/wishlist");
  }

  const products = await getCustomerWishlist();

  return (
    <section className="brand-surface min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-medium text-primary">Koleksi favorit</p>
          <h1 className="text-3xl font-semibold tracking-tight">Wishlist</h1>
          <p className="mt-2 text-muted-foreground">Produk yang kamu simpan untuk dilihat lagi nanti.</p>
        </div>

        {products.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={{ ...product, isWishlisted: true }} wishlistReturnTo="/wishlist" />
            ))}
          </div>
        ) : (
          <Card className="rounded-2xl bg-card/95 shadow-sm">
            <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                <Heart />
              </span>
              <p className="text-lg font-semibold">Wishlist masih kosong</p>
              <p className="max-w-md text-sm text-muted-foreground">Simpan produk hijab favorit dari katalog agar mudah ditemukan saat ingin checkout.</p>
              <Link href="/produk" className={buttonVariants({ variant: "outline" })}>Lihat Produk</Link>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
