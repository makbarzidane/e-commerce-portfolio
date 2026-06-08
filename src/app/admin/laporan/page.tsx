import Link from "next/link";
import { Download, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/admin";
import {
  formatDate,
  formatReportCurrency,
  getSalesReport,
  parseSalesPeriod,
  type SalesPeriod,
} from "@/lib/sales-report";

const periods: { value: SalesPeriod; label: string; description: string }[] = [
  { value: "weekly", label: "Mingguan", description: "7 hari terakhir" },
  { value: "monthly", label: "Bulanan", description: "Bulan berjalan" },
  { value: "yearly", label: "Tahunan", description: "Tahun berjalan" },
];

export default async function AdminSalesReportPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const period = parseSalesPeriod(params.period);
  const report = await getSalesReport(period);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Laporan Penjualan</p>
          <h1 className="text-3xl font-semibold tracking-tight">Export data omzet Zimeira</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Pilih periode laporan untuk melihat ringkasan penjualan dan download CSV dari order real di database.
          </p>
        </div>
        <Link href={`/api/admin/reports/sales/export?period=${period}`} className={buttonVariants()}>
          <Download data-icon="inline-start" />
          Export CSV
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {periods.map((item) => (
          <Link
            key={item.value}
            href={`/admin/laporan?period=${item.value}`}
            className={buttonVariants({
              variant: item.value === period ? "default" : "outline",
              className: "h-auto justify-start rounded-2xl p-4 text-left",
            })}
          >
            <span className="flex flex-col gap-1">
              <span className="font-semibold">{item.label}</span>
              <span className={item.value === period ? "text-primary-foreground/80" : "text-muted-foreground"}>{item.description}</span>
            </span>
          </Link>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="silk-panel border-b">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Ringkasan {report.label}</CardTitle>
              <CardDescription>
                {formatDate(report.startDate)} sampai {formatDate(report.endDate)}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="w-fit">
              <TrendingUp data-icon="inline-start" />
              {report.summary.orderCount} order
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-5">
          <Metric label="Omzet" value={formatReportCurrency(report.summary.revenue)} />
          <Metric label="Order" value={String(report.summary.orderCount)} />
          <Metric label="Item Terjual" value={String(report.summary.itemCount)} />
          <Metric label="Customer" value={String(report.summary.customerCount)} />
          <Metric label="Rata-rata Order" value={formatReportCurrency(report.summary.averageOrderValue)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Order</CardTitle>
          <CardDescription>Data yang sama akan masuk ke file CSV saat export.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Item</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.orders.length ? (
                report.orders.map((order) => (
                  <TableRow key={order.orderNumber}>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell><Badge variant="secondary">{order.status}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{order.paymentStatus}</Badge></TableCell>
                    <TableCell className="text-right">{order.itemCount}</TableCell>
                    <TableCell className="text-right font-medium">{formatReportCurrency(order.grandTotal)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Belum ada order pada periode ini.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-background p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
