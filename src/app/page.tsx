import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, PackageCheck, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ProductCard } from "@/components/product/product-card";
import { getStoreCategories, getStoreProductsForCurrentCustomer } from "@/lib/store-data";

export default async function HomePage() {
  const [categories, products] = await Promise.all([getStoreCategories(), getStoreProductsForCurrentCustomer()]);

  return (
    <>
      <SiteHeader />
      <main className="overflow-hidden">
        <section className="brand-surface relative">
          <div className="absolute inset-x-0 top-0 h-px gold-line" />
          <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_540px] lg:px-8">
          <div className="flex flex-col gap-7 animate-fade-up">
            <div className="flex flex-col gap-5">
              <div className="h-1 w-24 rounded-full bg-accent" />
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
                Zimeira Hijab Store
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                Ecommerce hijab premium dengan katalog lembut, varian warna dan bahan, cart, checkout, serta admin panel yang kini siap dipakai sebagai fondasi production.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/produk" className={buttonVariants({ size: "lg" })}>
                Belanja Sekarang
                <ArrowRight data-icon="inline-end" />
              </Link>
              <Link href="/admin" className={buttonVariants({ size: "lg", variant: "outline" })}>
                Lihat Admin Demo
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: Sparkles, label: "Visual premium" },
                { icon: ShieldCheck, label: "Auth dan admin aman" },
                { icon: Truck, label: "Siap payment dan ongkir" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="motion-card silk-panel flex items-center gap-3 rounded-xl border bg-card/80 p-4 text-sm font-medium shadow-sm">
                    <Icon className="size-4 text-primary" />
                    {item.label}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="relative animate-fade-up-delay">
            <div className="absolute -right-8 top-8 h-56 w-56 rounded-full bg-accent/25 blur-3xl" />
            <div className="absolute -left-10 bottom-12 h-44 w-44 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -left-6 top-8 z-10 hidden rounded-xl border bg-card/90 px-4 py-3 shadow-xl backdrop-blur md:block animate-float-soft">
              <p className="text-xs text-muted-foreground">Best seller</p>
              <p className="font-semibold">Pashmina Voal Rose</p>
            </div>
            <Card className="motion-card relative overflow-hidden rounded-2xl border-primary/20 bg-card/70 shadow-2xl shadow-primary/10">
              <CardContent className="p-0">
                <Image
                  src="/images/products/pashmina-rose.svg"
                  alt="Zimeira Pashmina Voal Rose"
                  width={900}
                  height={1100}
                  priority
                  className="aspect-[4/5] w-full object-cover"
                />
              </CardContent>
            </Card>
            <div className="absolute -bottom-5 right-8 rounded-xl border bg-background/95 p-4 shadow-xl backdrop-blur">
              <div className="flex items-center gap-3">
                <BadgeCheck className="size-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Checkout flow ready</p>
                  <p className="text-xs text-muted-foreground">Cart, order, payment record</p>
                </div>
              </div>
            </div>
          </div>
          </div>
        </section>

        <section className="border-y bg-card/80">
          <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-6 lg:px-8">
            {categories.map((category) => (
              <Link key={category.slug} href={`/produk?category=${category.slug}`} className="motion-card rounded-xl border bg-background/70 p-4 transition hover:border-primary hover:bg-muted/50">
                <p className="font-semibold">{category.name}</p>
                <p className="mt-2 text-sm text-muted-foreground">{category.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <Badge variant="secondary" className="gap-1">
                <PackageCheck className="size-3" />
                Koleksi pilihan
              </Badge>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Produk Hijab Terbaru</h2>
            </div>
            <Link href="/produk" className={buttonVariants({ variant: "outline" })}>Lihat Semua</Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} wishlistReturnTo="/" />
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
