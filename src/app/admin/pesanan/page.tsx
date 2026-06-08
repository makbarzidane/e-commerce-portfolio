import { Badge } from "@/components/ui/badge";
import { bulkUpdateOrders, deleteProblemOrder, updateOrderStatus, updateOrderTracking } from "@/app/admin/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { ConfirmSubmitButton, SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/admin";
import { getAdminOrders } from "@/lib/admin-data";
import { formatCurrency } from "@/lib/format";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; payment?: string; dateFrom?: string; dateTo?: string; page?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const pageSize = 20;
  const orders = await getAdminOrders({
    q: params.q,
    status: params.status,
    payment: params.payment,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    page,
    pageSize,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kelola Pesanan</CardTitle>
        <CardDescription>
          Pantau pesanan, pembayaran, resi, dan hapus order bermasalah. Order belum dibayar, gagal, expired, refund, batal, atau kosong bisa dibersihkan dengan stok otomatis dikembalikan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="mb-4 grid gap-3 xl:grid-cols-[1fr_160px_160px_150px_150px_auto]">
          <Input name="q" defaultValue={params.q ?? ""} placeholder="Cari order, nama, atau email" />
          <select name="status" defaultValue={params.status ?? ""} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
            <option value="">Semua order</option>
            {["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select name="payment" defaultValue={params.payment ?? ""} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
            <option value="">Semua payment</option>
            {["UNPAID", "PAID", "FAILED", "EXPIRED", "REFUNDED"].map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <Input name="dateFrom" type="date" defaultValue={params.dateFrom ?? ""} aria-label="Tanggal mulai" />
          <Input name="dateTo" type="date" defaultValue={params.dateTo ?? ""} aria-label="Tanggal akhir" />
          <SubmitButton type="submit" variant="outline" pendingLabel="Filter...">Filter</SubmitButton>
        </form>
        <form id="bulk-orders" action={bulkUpdateOrders} className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border bg-muted/35 p-3">
          <p className="w-full text-sm text-muted-foreground">
            Centang order di tabel, lalu pilih status untuk update banyak pesanan sekaligus.
          </p>
          <select name="bulkStatus" className="h-9 rounded-lg border border-input bg-background px-3 text-sm" required>
            <option value="">Ubah status order</option>
            {["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <ConfirmSubmitButton type="submit" size="sm" variant="outline" pendingLabel="Memproses..." confirmMessage="Update status semua order yang dicentang?">
            Terapkan
          </ConfirmSubmitButton>
        </form>
        <Table>
          <TableHeader>
              <TableRow>
                <TableHead>Pilih</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Pengiriman</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Resi</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Update</TableHead>
              </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const paymentStatus = order.payment?.status ?? "UNPAID";
              const canDelete =
                order.status === "CANCELLED" ||
                paymentStatus === "FAILED" ||
                paymentStatus === "EXPIRED" ||
                paymentStatus === "REFUNDED" ||
                (order.status === "PENDING" && paymentStatus === "UNPAID") ||
                order.items.length === 0;

              return (
                <TableRow key={order.orderNumber}>
                  <TableCell>
                    <input form="bulk-orders" type="checkbox" name="orderId" value={order.id} className="size-4 accent-primary" aria-label={`Pilih ${order.orderNumber}`} />
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/admin/pesanan/${order.orderNumber}`} className="hover:text-primary">
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{order.shippingProvider ?? "-"}</p>
                      <p className="text-muted-foreground">{order.shippingService ?? "-"} {order.shippingEstimate ? `(${order.shippingEstimate})` : ""}</p>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{order.status}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{paymentStatus}</Badge></TableCell>
                  <TableCell>{order.trackingNumber ?? "-"}</TableCell>
                  <TableCell className="text-right">{formatCurrency(order.grandTotal)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <form action={updateOrderStatus} className="flex flex-wrap justify-end gap-2">
                        <input type="hidden" name="id" value={order.id} />
                        <select name="status" defaultValue={order.status} className="h-8 rounded-lg border border-input bg-background px-2 text-xs">
                          {["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                        <select name="paymentStatus" defaultValue={paymentStatus} className="h-8 rounded-lg border border-input bg-background px-2 text-xs">
                          {["UNPAID", "PAID", "FAILED", "EXPIRED", "REFUNDED"].map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                        <SubmitButton type="submit" size="sm" variant="outline" pendingLabel="Simpan...">Simpan</SubmitButton>
                      </form>
                      <form action={updateOrderTracking} className="flex flex-wrap justify-end gap-2">
                        <input type="hidden" name="id" value={order.id} />
                        <input name="shippingProvider" defaultValue={order.shippingProvider ?? ""} placeholder="Kurir" className="h-8 w-24 rounded-lg border border-input bg-background px-2 text-xs" />
                        <input name="shippingService" defaultValue={order.shippingService ?? ""} placeholder="Layanan" className="h-8 w-24 rounded-lg border border-input bg-background px-2 text-xs" />
                        <input name="shippingEstimate" defaultValue={order.shippingEstimate ?? ""} placeholder="Estimasi" className="h-8 w-24 rounded-lg border border-input bg-background px-2 text-xs" />
                        <input name="trackingNumber" defaultValue={order.trackingNumber ?? ""} placeholder="No resi" className="h-8 w-28 rounded-lg border border-input bg-background px-2 text-xs" />
                        <SubmitButton type="submit" size="sm" variant="outline" pendingLabel="Update...">Resi</SubmitButton>
                      </form>
                      <form action={deleteProblemOrder}>
                        <input type="hidden" name="id" value={order.id} />
                        <ConfirmSubmitButton type="submit" size="sm" variant="destructive" disabled={!canDelete} pendingLabel="Menghapus..." confirmMessage="Hapus order bermasalah ini? Stok varian akan dikembalikan otomatis jika order memiliki item.">
                          Hapus
                        </ConfirmSubmitButton>
                        {!canDelete ? (
                          <p className="mt-1 max-w-28 text-right text-[11px] text-muted-foreground">
                            Ubah ke batal/gagal dulu
                          </p>
                        ) : null}
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <PaginationControls
          basePath="/admin/pesanan"
          page={page}
          hasNext={orders.length === pageSize}
          params={{ q: params.q, status: params.status, payment: params.payment, dateFrom: params.dateFrom, dateTo: params.dateTo }}
        />
      </CardContent>
    </Card>
  );
}
