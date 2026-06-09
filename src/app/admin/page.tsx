import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/admin/stat-card";
import { formatCurrency } from "@/lib/format";
import { requireAdmin } from "@/lib/admin";
import { getAdminDashboardData, getAdminLowStockVariants, getAdminSalesChartData, getAdminVariants } from "@/lib/admin-data";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [{ stats, orders }, variants, lowStockVariants, salesChart] = await Promise.all([
    getAdminDashboardData(),
    getAdminVariants(),
    getAdminLowStockVariants(5),
    getAdminSalesChartData(),
  ]);
  const maxSales = Math.max(...salesChart.map((item) => item.total), 1);
  const chartRevenue = salesChart.reduce((total, item) => total + item.total, 0);
  const chartPaidRevenue = salesChart.reduce((total, item) => total + (item.paidTotal ?? item.total), 0);
  const chartOrderCount = salesChart.reduce((total, item) => total + (item.orderCount ?? 0), 0);

  return (
    <>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard Admin</h1>
        <p className="text-muted-foreground">Ringkasan operasional toko dari database atau demo analytics portfolio.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Grafik Penjualan 7 Hari</CardTitle>
            <CardDescription>Omzet harian mengikuti order aktif, termasuk fallback demo saat database production belum dipasang.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <MiniMetric label="Omzet 7 hari" value={formatCurrency(chartRevenue)} />
              <MiniMetric label="Paid revenue" value={formatCurrency(chartPaidRevenue)} />
              <MiniMetric label="Total order" value={String(chartOrderCount)} />
            </div>
            <div className="flex h-72 items-end gap-3 rounded-xl border bg-muted/30 p-4">
              {salesChart.map((item) => (
                <div key={item.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div className="w-full truncate text-center text-[11px] font-medium text-foreground" title={formatCurrency(item.total)}>
                    {compactCurrency(item.total)}
                  </div>
                  <div className="flex h-40 w-full items-end rounded-lg bg-background">
                    <div
                      className="w-full rounded-lg bg-primary/80 transition-all"
                      style={{ height: `${Math.max(8, (item.total / maxSales) * 100)}%` }}
                      title={`${formatCurrency(item.total)} dari ${"orderCount" in item ? item.orderCount : 0} order`}
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground">{"orderCount" in item ? item.orderCount : 0} order</span>
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alert</CardTitle>
            <CardDescription>Varian aktif dengan stok 5 atau kurang perlu restock.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {lowStockVariants.map((variant) => (
              <div key={variant.sku} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{variant.product.name}</p>
                  <p className="text-xs text-muted-foreground">{variant.color} / {variant.material}</p>
                </div>
                <Badge variant={variant.stock <= 2 ? "destructive" : "outline"}>Stok {variant.stock}</Badge>
              </div>
            ))}
            {!lowStockVariants.length ? <p className="text-sm text-muted-foreground">Tidak ada stok rendah saat ini.</p> : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Pesanan Terbaru</CardTitle>
            <CardDescription>Kelola status pesanan pada tahap CRUD berikutnya.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.orderNumber}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell><Badge variant="secondary">{formatOrderStatus(order.status)}</Badge></TableCell>
                    <TableCell className="text-right">{formatCurrency(order.grandTotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Stok Varian Rendah</CardTitle>
            <CardDescription>Contoh monitoring stok per warna dan bahan.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {variants.slice(0, 4).map((variant) => (
              <div key={variant.sku} className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm font-medium">{variant.sku}</span>
                <Badge variant="outline">Stok {variant.stock}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background/70 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function compactCurrency(value: number) {
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `Rp ${Math.round(value / 1_000)}rb`;
  return formatCurrency(value);
}

function formatOrderStatus(status: string) {
  const labels: Record<string, string> = {
    PENDING: "Menunggu",
    PROCESSING: "Diproses",
    SHIPPED: "Dikirim",
    DELIVERED: "Selesai",
    CANCELLED: "Dibatalkan",
    REFUNDED: "Refunded",
  };

  return labels[status] ?? status;
}
