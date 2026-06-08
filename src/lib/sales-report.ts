import { adminOrders } from "@/lib/data";
import { formatCurrency } from "@/lib/format";
import { getPrisma } from "@/lib/prisma";

export type SalesPeriod = "weekly" | "monthly" | "yearly";

export type SalesReportOrder = {
  orderNumber: string;
  customerName: string;
  status: string;
  paymentStatus: string;
  itemCount: number;
  subtotal: number;
  discountTotal: number;
  shippingCost: number;
  grandTotal: number;
  createdAt: Date;
};

export type SalesReport = {
  period: SalesPeriod;
  label: string;
  startDate: Date;
  endDate: Date;
  summary: {
    revenue: number;
    orderCount: number;
    itemCount: number;
    customerCount: number;
    averageOrderValue: number;
  };
  orders: SalesReportOrder[];
};

const periodLabels: Record<SalesPeriod, string> = {
  weekly: "Mingguan",
  monthly: "Bulanan",
  yearly: "Tahunan",
};

export function parseSalesPeriod(value: string | null | undefined): SalesPeriod {
  if (value === "monthly" || value === "yearly") return value;
  return "weekly";
}

export function getSalesPeriodRange(period: SalesPeriod, now = new Date()) {
  const endDate = new Date(now);
  let startDate: Date;

  if (period === "yearly") {
    startDate = new Date(now.getFullYear(), 0, 1);
  } else if (period === "monthly") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 6);
  }

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
}

export async function getSalesReport(period: SalesPeriod): Promise<SalesReport> {
  const { startDate, endDate } = getSalesPeriodRange(period);

  try {
    const orders = await getPrisma().order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        items: { select: { quantity: true } },
        payment: { select: { status: true } },
      },
    });

    const mappedOrders = orders.map((order) => ({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      status: order.status,
      paymentStatus: order.payment?.status ?? "UNPAID",
      itemCount: order.items.reduce((total, item) => total + item.quantity, 0),
      subtotal: order.subtotal,
      discountTotal: order.discountTotal,
      shippingCost: order.shippingCost,
      grandTotal: order.grandTotal,
      createdAt: order.createdAt,
    }));

    return buildSalesReport(period, startDate, endDate, mappedOrders);
  } catch {
    const mappedOrders = adminOrders.map((order, index) => ({
      orderNumber: order.id,
      customerName: order.customer,
      status: order.status,
      paymentStatus: order.payment,
      itemCount: order.itemCount ?? 1 + index,
      subtotal: Math.max(0, order.total - 18000),
      discountTotal: order.payment === "PAID" ? Math.round(order.total * 0.05) : 0,
      shippingCost: 18000,
      grandTotal: order.total,
      createdAt: new Date(Date.now() - (order.daysAgo ?? index) * 86_400_000),
    }));

    return buildSalesReport(period, startDate, endDate, mappedOrders);
  }
}

export function salesReportToCsv(report: SalesReport) {
  const rows = [
    ["Periode", report.label],
    ["Tanggal Mulai", formatDate(report.startDate)],
    ["Tanggal Akhir", formatDate(report.endDate)],
    ["Total Omzet", String(report.summary.revenue)],
    ["Total Order", String(report.summary.orderCount)],
    [],
    [
      "Tanggal",
      "Nomor Order",
      "Customer",
      "Status Order",
      "Status Pembayaran",
      "Jumlah Item",
      "Subtotal",
      "Diskon",
      "Ongkir",
      "Grand Total",
    ],
    ...report.orders.map((order) => [
      formatDate(order.createdAt),
      order.orderNumber,
      order.customerName,
      order.status,
      order.paymentStatus,
      String(order.itemCount),
      String(order.subtotal),
      String(order.discountTotal),
      String(order.shippingCost),
      String(order.grandTotal),
    ]),
  ];

  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

export function getSalesExportFilename(period: SalesPeriod) {
  return `zimeira-sales-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatReportCurrency(value: number) {
  return formatCurrency(value);
}

function buildSalesReport(period: SalesPeriod, startDate: Date, endDate: Date, orders: SalesReportOrder[]): SalesReport {
  const revenue = orders.reduce((total, order) => total + order.grandTotal, 0);
  const itemCount = orders.reduce((total, order) => total + order.itemCount, 0);
  const uniqueCustomers = new Set(orders.map((order) => order.customerName.toLowerCase()));

  return {
    period,
    label: periodLabels[period],
    startDate,
    endDate,
    summary: {
      revenue,
      orderCount: orders.length,
      itemCount,
      customerCount: uniqueCustomers.size,
      averageOrderValue: orders.length ? Math.round(revenue / orders.length) : 0,
    },
    orders,
  };
}

function escapeCsvCell(value: string) {
  if (!/[",\n]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}
