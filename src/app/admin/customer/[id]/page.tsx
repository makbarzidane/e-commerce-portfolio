import Link from "next/link";
import { notFound } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, Heart, ReceiptText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/admin";
import { getAdminCustomerById } from "@/lib/admin-data";
import { formatCurrency } from "@/lib/format";

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const customer = await getAdminCustomerById(id);

  if (!customer) notFound();

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/customer" className={buttonVariants({ variant: "outline", size: "sm" })}>
          <ArrowLeft data-icon="inline-start" />
          Kembali
        </Link>
        <Badge variant="secondary">{customer.role}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{customer.name ?? "Customer"}</CardTitle>
            <CardDescription>{customer.email}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <p>Telepon: {customer.phone ?? "-"}</p>
            <p>Bergabung: {customer.createdAt.toLocaleDateString("id-ID")}</p>
          </CardContent>
        </Card>
        <SummaryCard icon={ReceiptText} label="Total Order" value={String(customer._count.orders)} />
        <SummaryCard icon={Heart} label="Wishlist" value={String(customer._count.wishlistItems)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pesanan</CardTitle>
          <CardDescription>20 pesanan terbaru customer ini.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customer.orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link href={`/admin/pesanan/${order.orderNumber}`} className="font-medium hover:text-primary">
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{order.status}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{order.payment?.status ?? "UNPAID"}</Badge></TableCell>
                  <TableCell>{order.items.length}</TableCell>
                  <TableCell className="text-right">{formatCurrency(order.grandTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Alamat Pengiriman</CardTitle>
            <CardDescription>Alamat yang pernah dipakai customer.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {customer.shippingAddresses.map((address) => (
              <div key={address.id} className="rounded-xl border p-4 text-sm">
                <p className="font-medium">{address.recipient} - {address.phone}</p>
                <p className="mt-1 text-muted-foreground">{address.addressLine}</p>
                <p className="text-muted-foreground">{address.district}, {address.city}, {address.province} {address.postalCode}</p>
              </div>
            ))}
            {!customer.shippingAddresses.length ? <p className="text-sm text-muted-foreground">Belum ada alamat.</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wishlist</CardTitle>
            <CardDescription>Produk yang disimpan customer.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {customer.wishlistItems.map((item) => (
              <Link key={item.id} href={`/produk/${item.product.slug}`} className="rounded-xl border p-4 text-sm transition hover:border-primary">
                <p className="font-medium">{item.product.name}</p>
                <p className="mt-1 text-muted-foreground">{formatCurrency(item.product.discountPrice ?? item.product.normalPrice)}</p>
              </Link>
            ))}
            {!customer.wishlistItems.length ? <p className="text-sm text-muted-foreground">Wishlist masih kosong.</p> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          <Icon data-icon="inline-start" />
          {label}
        </CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
