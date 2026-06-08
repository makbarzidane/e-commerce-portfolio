import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { Trash2 } from "lucide-react";
import { removeCartItem, updateCartQuantity } from "@/app/(shop)/keranjang/actions";
import { authOptions } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ConfirmSubmitButton, SubmitButton } from "@/components/ui/submit-button";
import { getCartLines } from "@/lib/cart";
import { formatCurrency } from "@/lib/format";

export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string; checkout?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;
  const isLoggedIn = Boolean(session?.user?.id);

  const cartItems = await getCartLines();
  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const shipping = cartItems.length ? 15000 : 0;

  return (
    <section className="brand-surface min-h-screen">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Keranjang</h1>
        {params.auth === "required" ? (
          <div className="rounded-2xl border border-primary/25 bg-primary/10 p-4 text-sm text-primary">
            Untuk checkout dan membuat pesanan, silakan login atau buat akun terlebih dahulu. Item guest tetap tersimpan di keranjang demo.
          </div>
        ) : null}
        {params.checkout === "demo" ? (
          <div className="rounded-2xl border border-primary/25 bg-primary/10 p-4 text-sm text-primary">
            Checkout portfolio sedang berjalan dalam mode demo tanpa database production. Keranjang bisa dicoba, tetapi pembuatan order real membutuhkan database aktif.
          </div>
        ) : null}
        {cartItems.length ? (
          cartItems.map((item) => (
            <Card key={item.id} className="motion-card rounded-2xl bg-card/90">
              <CardContent className="grid gap-4 p-4 sm:grid-cols-[120px_1fr_auto] sm:items-center">
                <Image src={item.product.image} alt={item.product.name} width={180} height={220} className="aspect-[4/5] rounded-md object-cover" />
                <div>
                  <Link href={`/produk/${item.product.slug}`} className="font-semibold hover:text-primary">
                    {item.product.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">{item.variant.color} / {item.variant.material}</p>
                  <p className={item.quantity > item.variant.stock || !item.variant.isActive ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
                    Stok tersedia {item.variant.stock}
                  </p>
                  <form action={updateCartQuantity} className="mt-3 flex items-center gap-2">
                    <input type="hidden" name="id" value={item.id} />
                    <Input name="quantity" type="number" min="1" defaultValue={item.quantity} className="w-20" />
                    <SubmitButton type="submit" size="sm" variant="outline" pendingLabel="Update...">Update</SubmitButton>
                  </form>
                </div>
                <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                  <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                  <form action={removeCartItem}>
                    <input type="hidden" name="id" value={item.id} />
                    <ConfirmSubmitButton type="submit" variant="ghost" size="icon" aria-label="Hapus item" pendingLabel="" confirmMessage="Hapus item ini dari keranjang?">
                      <Trash2 data-icon="only" />
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
              <p className="text-lg font-semibold">Keranjang masih kosong</p>
              <p className="text-sm text-muted-foreground">Pilih produk hijab favorit untuk mulai checkout.</p>
              <Link href="/produk" className={buttonVariants({ variant: "outline" })}>Belanja Produk</Link>
            </CardContent>
          </Card>
        )}
      </div>
      <Card className="silk-panel h-fit rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Ringkasan Belanja</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Estimasi ongkir</span>
            <span>{formatCurrency(shipping)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatCurrency(subtotal + shipping)}</span>
          </div>
          <Link
            href={isLoggedIn ? "/checkout" : "/keranjang?auth=required"}
            className={buttonVariants({ size: "lg", className: !cartItems.length ? "pointer-events-none opacity-50" : "" })}
          >
            Checkout
          </Link>
        </CardContent>
      </Card>
      </div>
    </section>
  );
}
