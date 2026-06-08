import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCurrentCustomer, getCustomerOrders } from "@/lib/customer-data";
import { formatCurrency } from "@/lib/format";

export default async function OrdersPage() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    redirect("/auth/login?callbackUrl=/pesanan");
  }

  const orders = await getCustomerOrders();

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <CardTitle>Riwayat Pesanan</CardTitle>
            <Link href="/lacak" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Lacak Pesanan
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {orders.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Pengiriman</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.date}</TableCell>
                    <TableCell><Badge variant="secondary">{order.status}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{order.paymentStatus}</Badge></TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{order.shippingProvider ?? "-"}</p>
                        <p className="text-muted-foreground">{order.shippingService ?? "-"} {order.shippingEstimate ? `(${order.shippingEstimate})` : ""}</p>
                        <p className="text-muted-foreground">Resi: {order.trackingNumber ?? "Belum tersedia"}</p>
                      </div>
                    </TableCell>
                    <TableCell>{order.items}</TableCell>
                    <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {canPay(order.paymentStatus) ? (
                          <Link href={`/checkout/sukses/${order.id}`} className={buttonVariants({ size: "sm" })}>Bayar</Link>
                        ) : null}
                        <Link href={`/pesanan/${order.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>Lihat</Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl border bg-background/70 p-10 text-center">
              <p className="text-lg font-semibold">Belum ada pesanan</p>
              <p className="text-sm text-muted-foreground">Pesanan baru akan muncul setelah checkout berhasil.</p>
              <Link href="/produk" className={buttonVariants({ variant: "outline" })}>Mulai Belanja</Link>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function canPay(status: string) {
  return status === "UNPAID" || status === "FAILED" || status === "EXPIRED";
}
