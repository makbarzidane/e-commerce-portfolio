import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, CreditCard, PackageCheck, Truck } from "lucide-react";
import { simulatePaymentPaid } from "@/app/(shop)/checkout/sukses/actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatCurrency } from "@/lib/format";
import { buildWhatsAppOrderUrl } from "@/lib/notifications";
import { getOrderByNumber } from "@/lib/order-data";
import { getPrisma } from "@/lib/prisma";

export default async function CheckoutSuccessPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const order = await getOrderByNumber(orderNumber);

  if (!order) notFound();
  const setting = await getPrisma().storeSetting.findFirst().catch(() => null);
  const whatsappUrl = buildWhatsAppOrderUrl(
    setting?.whatsapp ?? setting?.phone,
    `Halo Zimeira, saya ingin konfirmasi pesanan ${order.orderNumber} dengan total ${formatCurrency(order.grandTotal)}.`,
  );
  const paymentStatus = order.payment?.status ?? "UNPAID";
  const isPaid = paymentStatus === "PAID";

  return (
    <section className="brand-surface min-h-screen">
      <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <Card className="rounded-2xl bg-card/95 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <CheckCircle2 className="size-6" />
              </span>
              <div>
                <CardTitle>Pesanan berhasil dibuat</CardTitle>
                <p className="text-sm text-muted-foreground">{order.orderNumber}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="rounded-2xl border bg-secondary/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-semibold">
                  <CreditCard className="size-4" />
                  Pembayaran
                </div>
                <Badge variant={isPaid ? "secondary" : "outline"}>{paymentStatus}</Badge>
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">{order.payment?.method ?? order.payment?.provider ?? "Manual Transfer"}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {order.payment?.instructions ?? "Silakan lakukan pembayaran sesuai metode yang dipilih."}
              </p>
              {order.payment?.paymentUrl ? (
                <Link href={order.payment.paymentUrl} className={buttonVariants({ className: "mt-4" })}>
                  Bayar Sekarang
                </Link>
              ) : null}
              {!isPaid ? (
                <form action={simulatePaymentPaid} className="mt-4">
                  <input type="hidden" name="orderNumber" value={order.orderNumber} />
                  <SubmitButton type="submit" className="w-full" pendingLabel="Memproses pembayaran...">
                    Simulasikan Pembayaran Demo
                  </SubmitButton>
                </form>
              ) : (
                <div className="mt-4 rounded-xl border bg-background/70 p-3 text-sm text-muted-foreground">
                  Pembayaran sudah tercatat. Pesanan akan masuk proses admin.
                </div>
              )}
            </div>

            <div className="grid gap-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">{item.quantity} item {item.variantName ? `- ${item.variantName}` : ""}</p>
                  </div>
                  <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="silk-panel rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><PackageCheck className="size-4" /> Total</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
              <div className="flex justify-between"><span>Diskon</span><span>-{formatCurrency(order.discountTotal)}</span></div>
              <div className="flex justify-between"><span>Ongkir</span><span>{formatCurrency(order.shippingCost)}</span></div>
              <div className="flex justify-between text-base font-semibold"><span>Grand total</span><span>{formatCurrency(order.grandTotal)}</span></div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl bg-card/95 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Truck className="size-4" /> Pengiriman</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{order.shippingProvider ?? "Zimeira Delivery"} - {order.shippingService ?? "Regular"}</p>
              <p>Estimasi {order.shippingEstimate ?? "2-4 hari"}</p>
              <p className="mt-3">{order.shippingAddress?.addressLine}</p>
              <p>{order.shippingAddress?.district}, {order.shippingAddress?.city}</p>
            </CardContent>
          </Card>

          <Link href="/pesanan" className={buttonVariants({ className: "w-full" })}>Lihat Riwayat Pesanan</Link>
          <Link href={`/pesanan/${order.orderNumber}`} className={buttonVariants({ variant: "outline", className: "w-full" })}>Kembali ke Detail Pesanan</Link>
          {whatsappUrl ? (
            <Link href={whatsappUrl} className={buttonVariants({ variant: "outline", className: "w-full" })}>
              Konfirmasi via WhatsApp
            </Link>
          ) : null}
          <Link href="/produk" className={buttonVariants({ variant: "outline", className: "w-full" })}>Lanjut Belanja</Link>
        </div>
      </div>
    </section>
  );
}
