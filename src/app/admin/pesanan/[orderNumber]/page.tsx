import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CreditCard, MapPin, PackageCheck, RotateCcw, Truck } from "lucide-react";
import { updateReturnRequest } from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { requireAdmin } from "@/lib/admin";
import { getAdminOrderByNumber } from "@/lib/admin-data";
import { formatCurrency } from "@/lib/format";
import { buildWhatsAppOrderUrl } from "@/lib/notifications";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  await requireAdmin();
  const { orderNumber } = await params;
  const order = await getAdminOrderByNumber(orderNumber);

  if (!order) notFound();
  const notifications = [
    {
      label: "Order dibuat",
      message: `Halo ${order.customerName}, pesanan ${order.orderNumber} berhasil dibuat di Zimeira Hijab Store. Total pembayaran ${formatCurrency(order.grandTotal)}.`,
    },
    {
      label: "Payment sukses",
      message: `Halo ${order.customerName}, pembayaran pesanan ${order.orderNumber} sudah kami terima. Pesanan akan segera diproses.`,
    },
    {
      label: "Pesanan dikirim",
      message: `Halo ${order.customerName}, pesanan ${order.orderNumber} sudah dikirim via ${order.shippingProvider ?? "kurir"} ${order.shippingService ?? ""}. Resi: ${order.trackingNumber ?? "akan segera diperbarui"}.`,
    },
    {
      label: "Pesanan selesai",
      message: `Halo ${order.customerName}, pesanan ${order.orderNumber} sudah selesai. Terima kasih sudah belanja di Zimeira Hijab Store.`,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin/pesanan" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <ArrowLeft data-icon="inline-start" />
            Kembali
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">{order.orderNumber}</h1>
          <p className="text-muted-foreground">{order.customerName} - {order.customerEmail}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{order.status}</Badge>
          <Badge variant="outline">{order.payment?.status ?? "UNPAID"}</Badge>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PackageCheck data-icon="inline-start" /> Item Pesanan</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl border bg-background p-4">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-sm text-muted-foreground">{item.variantName ?? "-"} - {item.quantity} item</p>
                </div>
                <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="silk-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard data-icon="inline-start" /> Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between"><span>Metode</span><span>{order.payment?.method ?? "-"}</span></div>
              <div className="flex justify-between"><span>Status</span><span>{order.payment?.status ?? "UNPAID"}</span></div>
              <div className="flex justify-between"><span>Transaksi</span><span>{order.payment?.transactionId ?? "-"}</span></div>
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
              <div className="flex justify-between"><span>Diskon</span><span>-{formatCurrency(order.discountTotal)}</span></div>
              <div className="flex justify-between"><span>Ongkir</span><span>{formatCurrency(order.shippingCost)}</span></div>
              <div className="flex justify-between text-base font-semibold"><span>Total</span><span>{formatCurrency(order.grandTotal)}</span></div>
              {order.coupon?.code ? <p className="text-muted-foreground">Voucher: {order.coupon.code}</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Truck data-icon="inline-start" /> Pengiriman</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{order.shippingProvider ?? "-"} - {order.shippingService ?? "-"}</p>
              <p>Estimasi {order.shippingEstimate ?? "-"}</p>
              <p>Resi {order.trackingNumber ?? "-"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><RotateCcw data-icon="inline-start" /> Retur / Refund</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {order.returnRequests.map((request) => (
                <form key={request.id} action={updateReturnRequest} className="grid gap-3 rounded-xl border p-3 text-sm">
                  <input type="hidden" name="id" value={request.id} />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="secondary">{request.status}</Badge>
                    <span className="text-xs text-muted-foreground">{request.createdAt.toLocaleString("id-ID")}</span>
                  </div>
                  <p className="text-muted-foreground">{request.reason}</p>
                  <select name="status" defaultValue={request.status} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
                    {["REQUESTED", "APPROVED", "REJECTED", "RECEIVED", "REFUNDED", "CANCELLED"].map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <Input name="refundAmount" type="number" min="0" defaultValue={request.refundAmount ?? 0} placeholder="Nominal refund" />
                  <Textarea name="adminNote" defaultValue={request.adminNote ?? ""} placeholder="Catatan admin untuk customer" />
                  <SubmitButton type="submit" variant="outline" size="sm" pendingLabel="Menyimpan...">
                    Simpan Retur
                  </SubmitButton>
                </form>
              ))}
              {!order.returnRequests.length ? <p className="text-sm text-muted-foreground">Belum ada pengajuan retur untuk order ini.</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MapPin data-icon="inline-start" /> Alamat</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{order.shippingAddress?.recipient ?? order.customerName}</p>
              <p>{order.shippingAddress?.phone ?? order.customerPhone}</p>
              <p className="mt-2">{order.shippingAddress?.addressLine ?? "-"}</p>
              <p>{order.shippingAddress?.district}, {order.shippingAddress?.city}</p>
              <p>{order.shippingAddress?.province} {order.shippingAddress?.postalCode}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifikasi WhatsApp</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {notifications.map((item) => {
                const href = buildWhatsAppOrderUrl(order.customerPhone, item.message);

                return href ? (
                  <Link key={item.label} href={href} target="_blank" className={buttonVariants({ variant: "outline", size: "sm", className: "justify-start" })}>
                    {item.label}
                  </Link>
                ) : (
                  <span key={item.label} className="text-sm text-muted-foreground">Nomor customer tidak valid untuk {item.label}</span>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
