import Link from "next/link";
import { redirect } from "next/navigation";
import { PackageSearch, Search, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentCustomer, getCustomerOrders } from "@/lib/customer-data";
import { formatCurrency } from "@/lib/format";

export default async function TrackingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const customer = await getCurrentCustomer();
  if (!customer) {
    redirect("/auth/login?callbackUrl=/lacak");
  }

  const { q = "" } = await searchParams;
  const orders = await getCustomerOrders();
  const query = q.trim().toLowerCase();
  const filteredOrders = query
    ? orders.filter((order) => order.id.toLowerCase().includes(query) || String(order.trackingNumber ?? "").toLowerCase().includes(query))
    : orders;

  return (
    <section className="brand-surface min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="animate-fade-up flex flex-col gap-3">
          <Badge variant="secondary" className="w-fit">
            <Truck className="size-3" />
            Status pengiriman
          </Badge>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight">Lacak Pesanan</h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Cek status order, pembayaran, nomor resi, dan progres pengiriman dari pesanan yang sudah dibuat.
              </p>
            </div>
            <Link href="/pesanan" className={buttonVariants({ variant: "outline" })}>
              Riwayat Pesanan
            </Link>
          </div>
        </div>

        <Card className="rounded-2xl bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageSearch className="size-4" />
              Cari nomor order atau resi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input name="q" defaultValue={q} placeholder="Contoh: ZMS-2026 atau nomor resi" className="pl-9" />
              </div>
              <button type="submit" className={buttonVariants()}>
                Cari
              </button>
            </form>
          </CardContent>
        </Card>

        {filteredOrders.length ? (
          <div className="grid gap-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="motion-card rounded-2xl bg-card/95 shadow-sm">
                <CardContent className="grid gap-5 p-5 lg:grid-cols-[1fr_300px] lg:items-center">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold">{order.id}</p>
                      <Badge variant="secondary">{order.status}</Badge>
                      <Badge variant="outline">{order.paymentStatus}</Badge>
                    </div>
                    <div className="grid gap-3 text-sm sm:grid-cols-3">
                      <Info label="Tanggal" value={order.date} />
                      <Info label="Jasa kirim" value={`${order.shippingProvider ?? "-"} ${order.shippingService ? `- ${order.shippingService}` : ""}`} />
                      <Info label="Estimasi" value={order.shippingEstimate ?? "-"} />
                    </div>
                    <div className="rounded-xl border bg-background/70 p-3 text-sm">
                      <p className="font-medium">{getTrackingLabel(order.status, order.trackingNumber)}</p>
                      <p className="mt-1 text-muted-foreground">Resi: {order.trackingNumber ?? "Belum tersedia dari admin"}</p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-4">
                      {trackingSteps(order.status).map((step) => (
                        <div key={step.label} className={step.active ? "rounded-xl border border-primary/30 bg-secondary/70 p-3 text-sm" : "rounded-xl border bg-background/70 p-3 text-sm text-muted-foreground"}>
                          <p className="font-medium">{step.label}</p>
                          <p className="mt-1 text-xs">{step.active ? "Sudah lewat" : "Menunggu"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 rounded-xl border bg-background/70 p-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Item</span>
                      <span className="font-medium">{order.items}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-semibold">{formatCurrency(order.total)}</span>
                    </div>
                    {canPay(order.paymentStatus) ? (
                      <Link href={`/checkout/sukses/${order.id}`} className={buttonVariants({ className: "mt-2 w-full" })}>
                        Bayar Sekarang
                      </Link>
                    ) : null}
                    <Link href={`/pesanan/${order.id}`} className={buttonVariants({ variant: canPay(order.paymentStatus) ? "outline" : "default", className: "w-full" })}>
                      Lihat Detail Pesanan
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="rounded-2xl bg-card/95 shadow-sm">
            <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
              <PackageSearch className="size-10 text-muted-foreground" />
              <p className="text-lg font-semibold">Pesanan tidak ditemukan</p>
              <p className="text-sm text-muted-foreground">Pastikan nomor order atau resi yang dicari sudah benar.</p>
              <Link href="/produk" className={buttonVariants({ variant: "outline" })}>
                Belanja Produk
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function getTrackingLabel(status: string, trackingNumber: string | null) {
  if (status === "DELIVERED") return "Pesanan sudah diterima";
  if (status === "SHIPPED" && trackingNumber) return "Paket sedang dalam perjalanan";
  if (status === "SHIPPED") return "Paket sudah dikirim, resi menunggu input admin";
  if (status === "PROCESSING") return "Pesanan sedang dikemas toko";
  if (status === "CANCELLED") return "Pesanan dibatalkan";
  return "Menunggu pembayaran atau konfirmasi admin";
}

function trackingSteps(status: string) {
  const sequence = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];
  const current = Math.max(0, sequence.indexOf(status));

  return [
    { label: "Order dibuat", active: status !== "CANCELLED" },
    { label: "Diproses", active: current >= 1 },
    { label: "Dikirim", active: current >= 2 },
    { label: "Selesai", active: current >= 3 },
  ];
}

function canPay(status: string) {
  return status === "UNPAID" || status === "FAILED" || status === "EXPIRED";
}
