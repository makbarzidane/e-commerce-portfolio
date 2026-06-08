import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { CreditCard, PackageCheck, RotateCcw, Star, Truck } from "lucide-react";
import { simulatePaymentPaid } from "@/app/(shop)/checkout/sukses/actions";
import { requestReturn, submitProductReview } from "@/app/(shop)/pesanan/actions";
import { authOptions } from "@/lib/auth";
import { getOrderByNumber } from "@/lib/order-data";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { getPrisma } from "@/lib/prisma";

export default async function CustomerOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ error?: string; return?: string; review?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/pesanan");
  }

  const { orderNumber } = await params;
  const status = await searchParams;
  const order = await getOrderByNumber(orderNumber);
  if (!order || order.userId !== session.user.id) notFound();
  const activeReturn = order.returnRequests[0];
  const canRequestReturn = order.status === "DELIVERED" && !activeReturn;
  const canReview = order.status === "SHIPPED" || order.status === "DELIVERED";
  const paymentStatus = order.payment?.status ?? "UNPAID";
  const isPaid = paymentStatus === "PAID";
  const canPay = paymentStatus === "UNPAID" || paymentStatus === "FAILED" || paymentStatus === "EXPIRED";
  const existingReviews = await getPrisma().review.findMany({
    where: { userId: session.user.id, productId: { in: order.items.map((item) => item.productId) } },
    select: { productId: true, rating: true, comment: true },
  }).catch(() => []);
  const reviewMap = new Map(existingReviews.map((review) => [review.productId, review]));

  return (
    <section className="brand-surface min-h-screen">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <Card className="rounded-2xl bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              Detail Pesanan
              <Badge variant="secondary">{order.status}</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">{order.orderNumber}</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {status.return === "requested" ? <Notice>Pengajuan retur berhasil dikirim dan menunggu review admin.</Notice> : null}
            {status.error === "return-validation" ? <Notice tone="error">Alasan retur minimal 10 karakter.</Notice> : null}
            {status.error === "return-exists" ? <Notice tone="error">Pesanan ini sudah memiliki pengajuan retur aktif.</Notice> : null}
            {status.review === "saved" ? <Notice>Review produk berhasil disimpan.</Notice> : null}
            {status.error === "review-validation" ? <Notice tone="error">Rating dan komentar minimal 5 karakter wajib diisi.</Notice> : null}
            {status.error === "review-unavailable" ? <Notice tone="error">Review hanya bisa dikirim untuk produk yang sudah dibeli dan dikirim.</Notice> : null}
            {status.error === "review-exists" ? <Notice tone="error">Review untuk produk ini sudah pernah dikirim dan hanya bisa diisi satu kali.</Notice> : null}
            {order.items.map((item) => (
              <div key={item.id} className="rounded-xl border bg-background/70 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">{item.quantity} item {item.variantName ? `- ${item.variantName}` : ""}</p>
                  </div>
                  <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                </div>
                {canReview && reviewMap.has(item.productId) ? (
                  <div className="mt-3 rounded-lg border bg-secondary/50 p-3 text-sm">
                    <div className="flex items-center gap-1 font-medium">
                      {Array.from({ length: reviewMap.get(item.productId)?.rating ?? 0 }).map((_, index) => (
                        <Star key={index} className="size-4 fill-current text-accent" />
                      ))}
                      <span className="ml-2">Review sudah dikirim</span>
                    </div>
                    <p className="mt-2 text-muted-foreground">{reviewMap.get(item.productId)?.comment}</p>
                  </div>
                ) : canReview ? (
                  <form action={submitProductReview} className="mt-3 grid gap-2 rounded-lg border bg-card/70 p-3">
                    <input type="hidden" name="orderNumber" value={order.orderNumber} />
                    <input type="hidden" name="productId" value={item.productId} />
                    <div className="grid gap-2 sm:grid-cols-[140px_1fr_auto] sm:items-end">
                      <label className="grid gap-1 text-xs font-medium">
                        Rating
                        <select name="rating" defaultValue={5} className="h-9 rounded-lg border border-input bg-background px-2 text-sm">
                          {[5, 4, 3, 2, 1].map((rating) => (
                            <option key={rating} value={rating}>{rating} bintang</option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1 text-xs font-medium">
                        Komentar
                        <input name="comment" placeholder="Tulis feedback produk" className="h-9 rounded-lg border border-input bg-background px-3 text-sm" />
                      </label>
                      <SubmitButton type="submit" size="sm" variant="outline" pendingLabel="Simpan...">
                        Simpan Review
                      </SubmitButton>
                    </div>
                  </form>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="silk-panel rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><PackageCheck className="size-4" /> Ringkasan</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
              <div className="flex justify-between"><span>Diskon</span><span>-{formatCurrency(order.discountTotal)}</span></div>
              <div className="flex justify-between"><span>Ongkir</span><span>{formatCurrency(order.shippingCost)}</span></div>
              <div className="flex justify-between font-semibold"><span>Total</span><span>{formatCurrency(order.grandTotal)}</span></div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl bg-card/95 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="size-4" /> Pembayaran</CardTitle>
            </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
              <Badge className="w-fit" variant={isPaid ? "secondary" : "outline"}>{paymentStatus}</Badge>
              <div className="rounded-xl border bg-background/70 p-3">
                <p className="font-medium text-foreground">{order.payment?.method ?? order.payment?.provider ?? "Manual Transfer"}</p>
                <p className="mt-2 leading-6">{order.payment?.instructions ?? "Silakan lakukan pembayaran sesuai metode yang dipilih."}</p>
              </div>
              {order.payment?.paymentUrl ? (
                <Link href={order.payment.paymentUrl} className={buttonVariants({ className: "w-full" })}>
                  Lanjutkan Pembayaran
                </Link>
              ) : null}
              {canPay ? (
                <>
                  <Link href={`/checkout/sukses/${order.orderNumber}`} className={buttonVariants({ className: "w-full" })}>
                    Buka Halaman Pembayaran
                  </Link>
                  <form action={simulatePaymentPaid}>
                    <input type="hidden" name="orderNumber" value={order.orderNumber} />
                    <SubmitButton type="submit" className="w-full" pendingLabel="Memproses pembayaran...">
                      Simulasikan Pembayaran Demo
                    </SubmitButton>
                  </form>
                </>
              ) : isPaid ? (
                <div className="rounded-xl border bg-secondary/50 p-3 text-sm text-secondary-foreground">
                  Pembayaran sudah tercatat. Pesanan sedang menunggu proses toko.
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-2xl bg-card/95 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><RotateCcw className="size-4" /> Retur / Refund</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              {activeReturn ? (
                <div className="rounded-xl border bg-background/70 p-3">
                  <Badge variant="secondary">{activeReturn.status}</Badge>
                  <p className="mt-2 text-muted-foreground">{activeReturn.reason}</p>
                  {activeReturn.adminNote ? <p className="mt-2 text-muted-foreground">Catatan admin: {activeReturn.adminNote}</p> : null}
                  {activeReturn.refundAmount ? <p className="mt-2 font-medium">Refund: {formatCurrency(activeReturn.refundAmount)}</p> : null}
                </div>
              ) : canRequestReturn ? (
                <form action={requestReturn} className="grid gap-3">
                  <input type="hidden" name="orderNumber" value={order.orderNumber} />
                  <Textarea name="reason" placeholder="Jelaskan alasan retur/refund, contoh: warna tidak sesuai atau produk rusak." required />
                  <SubmitButton type="submit" variant="outline" pendingLabel="Mengirim pengajuan...">
                    Ajukan Retur
                  </SubmitButton>
                </form>
              ) : (
                <p className="text-muted-foreground">Retur bisa diajukan setelah pesanan berstatus DELIVERED dan belum memiliki pengajuan aktif.</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl bg-card/95 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Truck className="size-4" /> Status & Lacak Paket</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="grid gap-2 rounded-xl border bg-background/70 p-3">
                {trackingSteps(order.status).map((step) => (
                  <div key={step.label} className="flex items-center justify-between gap-3">
                    <span className={step.active ? "font-medium text-foreground" : ""}>{step.label}</span>
                    <Badge variant={step.active ? "secondary" : "outline"}>{step.active ? "Aktif" : "Menunggu"}</Badge>
                  </div>
                ))}
              </div>
              <p className="font-medium text-foreground">{order.shippingProvider ?? "-"} {order.shippingService ? `- ${order.shippingService}` : ""}</p>
              <p>Estimasi: {order.shippingEstimate ?? "-"}</p>
              <div className="rounded-xl border bg-background/70 p-3">
                <p className="font-medium text-foreground">{getTrackingLabel(order.status, order.trackingNumber)}</p>
                <p className="mt-1 text-xs">Status ini mengikuti status pesanan dari admin. Integrasi tracking provider bisa disambungkan setelah API Biteship aktif.</p>
              </div>
              <p>Resi: <span className="font-medium text-foreground">{order.trackingNumber ?? "Belum tersedia"}</span></p>
              <p className="pt-2">{order.shippingAddress?.addressLine}</p>
              <p>{order.shippingAddress?.district}, {order.shippingAddress?.city}</p>
            </CardContent>
          </Card>

          <Link href={`/invoice/${order.orderNumber}`} className={buttonVariants({ className: "w-full" })}>Cetak Invoice</Link>
          <Link href="/pesanan" className={buttonVariants({ variant: "outline", className: "w-full" })}>Kembali ke Riwayat</Link>
        </div>
      </div>
    </section>
  );
}

function Notice({ children, tone = "success" }: { children: React.ReactNode; tone?: "success" | "error" }) {
  return (
    <div className={tone === "error" ? "rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive" : "rounded-2xl border bg-secondary/70 p-4 text-sm text-secondary-foreground"}>
      {children}
    </div>
  );
}

function getTrackingLabel(status: string, trackingNumber: string | null) {
  if (status === "DELIVERED") return "Pesanan sudah diterima";
  if (status === "SHIPPED" && trackingNumber) return "Pesanan sedang dikirim";
  if (status === "PROCESSING") return "Pesanan sedang diproses toko";
  if (status === "CANCELLED") return "Pesanan dibatalkan";
  return "Menunggu konfirmasi pembayaran";
}

function trackingSteps(status: string) {
  const order = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];
  const current = Math.max(0, order.indexOf(status));
  return [
    { label: "Menunggu pembayaran", active: current >= 0 && status !== "CANCELLED" },
    { label: "Diproses toko", active: current >= 1 },
    { label: "Dikirim", active: current >= 2 },
    { label: "Selesai", active: current >= 3 },
  ];
}
