import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { PrintButton } from "@/components/ui/print-button";
import { authOptions } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { getOrderByNumber } from "@/lib/order-data";

export default async function CleanInvoicePage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/pesanan");
  }

  const { orderNumber } = await params;
  const order = await getOrderByNumber(orderNumber);
  if (!order || order.userId !== session.user.id) notFound();

  return (
    <main className="min-h-screen bg-[#f7f1eb] px-4 py-8 text-[#241f1b] print:bg-white print:px-0 print:py-0">
      <div className="mx-auto mb-5 flex max-w-4xl flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/pesanan/${order.orderNumber}`} className={buttonVariants({ variant: "outline" })}>
          <ArrowLeft data-icon="inline-start" />
          Kembali ke Pesanan
        </Link>
        <PrintButton>
          <Printer data-icon="inline-start" />
          Cetak / Simpan PDF
        </PrintButton>
      </div>

      <article className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm print:rounded-none print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-[#eadbd2] pb-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#9b6870]">Invoice</p>
            <h1 className="mt-3 text-3xl font-semibold">Zimeira Hijab Store</h1>
            <p className="mt-1 text-sm text-[#7c6860]">Struk transaksi resmi pesanan customer.</p>
          </div>
          <div className="min-w-56 rounded-xl border border-[#eadbd2] bg-[#fff9f4] p-4 text-sm">
            <p className="text-[#7c6860]">Nomor Order</p>
            <p className="font-semibold">{order.orderNumber}</p>
            <p className="mt-3 text-[#7c6860]">Tanggal</p>
            <p>{order.createdAt.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">{order.status}</Badge>
              <Badge variant="outline">{order.payment?.status ?? "UNPAID"}</Badge>
            </div>
          </div>
        </header>

        <section className="grid gap-6 border-b border-[#eadbd2] py-7 sm:grid-cols-2">
          <div>
            <p className="text-sm font-semibold">Dari</p>
            <p className="mt-2 font-medium">Zimeira Hijab Store</p>
            <p className="text-sm text-[#7c6860]">Fictional hijab brand from Pagar Alam, founded in 2026</p>
          </div>
          <div>
            <p className="text-sm font-semibold">Ditagihkan kepada</p>
            <p className="mt-2 font-medium">{order.customerName}</p>
            <p>{order.customerEmail}</p>
            <p>{order.customerPhone}</p>
          </div>
        </section>

        <section className="py-7">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#eadbd2] text-left">
                <th className="py-3 pr-3">Produk</th>
                <th className="py-3 pr-3 text-center">Qty</th>
                <th className="py-3 pr-3 text-right">Harga</th>
                <th className="py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-[#f0e3dc]">
                  <td className="py-4 pr-3">
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-xs text-[#7c6860]">{item.variantName}</p>
                  </td>
                  <td className="py-4 pr-3 text-center">{item.quantity}</td>
                  <td className="py-4 pr-3 text-right">{formatCurrency(item.price)}</td>
                  <td className="py-4 text-right font-medium">{formatCurrency(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="grid gap-6 border-t border-[#eadbd2] pt-6 sm:grid-cols-[1fr_320px]">
          <div className="rounded-xl border border-[#eadbd2] bg-[#fff9f4] p-4 text-sm">
            <p className="font-semibold">Pengiriman</p>
            <p className="mt-2">{order.shippingProvider ?? "-"} {order.shippingService ? `- ${order.shippingService}` : ""}</p>
            <p>Estimasi: {order.shippingEstimate ?? "-"}</p>
            <p>Resi: {order.trackingNumber ?? "Belum tersedia"}</p>
            <p className="mt-3">{order.shippingAddress?.addressLine}</p>
            <p>{order.shippingAddress?.district}, {order.shippingAddress?.city}, {order.shippingAddress?.province} {order.shippingAddress?.postalCode}</p>
          </div>

          <div className="grid gap-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
            <div className="flex justify-between"><span>Diskon</span><span>-{formatCurrency(order.discountTotal)}</span></div>
            <div className="flex justify-between"><span>Ongkir</span><span>{formatCurrency(order.shippingCost)}</span></div>
            <div className="mt-2 flex justify-between border-t border-[#eadbd2] pt-3 text-lg font-semibold">
              <span>Total</span>
              <span>{formatCurrency(order.grandTotal)}</span>
            </div>
          </div>
        </section>

        <footer className="mt-8 border-t border-[#eadbd2] pt-4 text-center text-xs text-[#7c6860]">
          Terima kasih sudah berbelanja di Zimeira Hijab Store.
        </footer>
      </article>
    </main>
  );
}
