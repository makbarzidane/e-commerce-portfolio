import { cookies } from "next/headers";
import type { CartLine } from "@/lib/cart";
import { adminOrders, products as fallbackProducts } from "@/lib/data";
import { findPaymentMethod } from "@/lib/integrations/payment";
import type { ShippingRate } from "@/lib/integrations/shipping";

const demoOrdersCookie = "zimeira_demo_orders";

type DemoOrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
type DemoPaymentStatus = "UNPAID" | "PAID" | "FAILED" | "EXPIRED" | "REFUNDED";

export type DemoOrder = {
  id: string;
  orderNumber: string;
  userId: string;
  status: DemoOrderStatus;
  subtotal: number;
  discountTotal: number;
  shippingCost: number;
  shippingProvider: string | null;
  shippingService: string | null;
  shippingEstimate: string | null;
  trackingNumber: string | null;
  trackingStatus: string | null;
  trackingUpdatedAt: Date | null;
  grandTotal: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    id: string;
    userId: string;
    label: string | null;
    recipient: string;
    phone: string;
    province: string;
    city: string;
    district: string;
    postalCode: string;
    addressLine: string;
    createdAt: Date;
    updatedAt: Date;
  };
  payment: {
    id: string;
    orderId: string;
    provider: "MANUAL_TRANSFER" | "MIDTRANS";
    status: DemoPaymentStatus;
    amount: number;
    method: string | null;
    instructions: string | null;
    transactionId: string | null;
    paymentUrl: string | null;
    paidAt: Date | null;
    refundedAt: Date | null;
    refundReason: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  items: Array<{
    id: string;
    orderId: string;
    productId: string;
    variantId: string | null;
    productName: string;
    variantName: string | null;
    quantity: number;
    price: number;
    createdAt: Date;
  }>;
  returnRequests: Array<{
    id: string;
    status: string;
    reason: string;
    adminNote: string | null;
    refundAmount: number | null;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
};

type DemoOrderInput = {
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  province: string;
  city: string;
  district: string;
  postalCode: string;
  addressLine: string;
  cartItems: CartLine[];
  shippingRate: ShippingRate;
  paymentMethodId: string;
  discountTotal: number;
};

export async function createDemoOrder(input: DemoOrderInput) {
  const now = new Date();
  const orderNumber = `ZMS-${now.getFullYear()}-${String(Date.now()).slice(-6)}`;
  const subtotal = input.cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const grandTotal = Math.max(0, subtotal - input.discountTotal) + input.shippingRate.cost;
  const paymentMethod = findPaymentMethod(input.paymentMethodId);
  const paymentIsMidtrans = paymentMethod.provider === "MIDTRANS";
  const orderId = `demo-order-${orderNumber}`;

  const order: DemoOrder = {
    id: orderId,
    orderNumber,
    userId: input.userId,
    status: "PENDING",
    subtotal,
    discountTotal: input.discountTotal,
    shippingCost: input.shippingRate.cost,
    shippingProvider: input.shippingRate.provider,
    shippingService: input.shippingRate.service,
    shippingEstimate: input.shippingRate.etd,
    trackingNumber: null,
    trackingStatus: null,
    trackingUpdatedAt: null,
    grandTotal,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    shippingAddress: {
      id: `demo-address-${orderNumber}`,
      userId: input.userId,
      label: null,
      recipient: input.customerName,
      phone: input.customerPhone,
      province: input.province,
      city: input.city,
      district: input.district,
      postalCode: input.postalCode,
      addressLine: input.addressLine,
      createdAt: now,
      updatedAt: now,
    },
    payment: {
      id: `demo-payment-${orderNumber}`,
      orderId,
      provider: paymentIsMidtrans ? "MANUAL_TRANSFER" : paymentMethod.provider,
      status: "UNPAID",
      amount: grandTotal,
      method: paymentIsMidtrans ? "Manual Transfer Demo" : paymentMethod.label,
      instructions: paymentIsMidtrans
        ? "Midtrans sandbox belum aktif di portfolio ini. Gunakan tombol Simulasikan Pembayaran Demo untuk mencoba status paid."
        : paymentMethod.instructions,
      transactionId: `DEMO-${orderNumber}`,
      paymentUrl: null,
      paidAt: null,
      refundedAt: null,
      refundReason: null,
      createdAt: now,
      updatedAt: now,
    },
    items: input.cartItems.map((item, index) => ({
      id: `demo-item-${orderNumber}-${index + 1}`,
      orderId,
      productId: item.product.id,
      variantId: item.variant.id,
      productName: item.product.name,
      variantName: `${item.variant.color} / ${item.variant.material}`,
      quantity: item.quantity,
      price: item.price,
      createdAt: now,
    })),
    returnRequests: [],
    createdAt: now,
    updatedAt: now,
  };

  await saveDemoOrder(order);
  return order;
}

export async function getDemoOrders() {
  const stored = await readStoredDemoOrders();
  return stored.length ? stored : getSeedDemoOrders();
}

export async function getDemoOrdersForUser(userId: string) {
  const stored = await readStoredDemoOrders();
  const ownOrders = stored.filter((order) => order.userId === userId);
  if (ownOrders.length) return ownOrders;
  return userId === "demo-customer" ? getSeedDemoOrders() : [];
}

export async function getDemoOrderByNumber(orderNumber: string) {
  const orders = await getDemoOrders();
  return orders.find((order) => order.orderNumber === orderNumber) ?? null;
}

export async function markDemoOrderPaid(orderNumber: string, userId: string) {
  const orders = await readStoredDemoOrders();
  const target = orders.find((order) => order.orderNumber === orderNumber && order.userId === userId);
  if (!target) return false;

  const now = new Date();
  target.status = target.status === "PENDING" ? "PROCESSING" : target.status;
  target.payment.status = "PAID";
  target.payment.paidAt = now;
  target.payment.updatedAt = now;
  target.updatedAt = now;
  await writeDemoOrders(orders);
  return true;
}

async function saveDemoOrder(order: DemoOrder) {
  const current = await readStoredDemoOrders();
  await writeDemoOrders([order, ...current.filter((item) => item.orderNumber !== order.orderNumber)].slice(0, 4));
}

async function readStoredDemoOrders() {
  const cookieStore = await cookies();
  const value = cookieStore.get(demoOrdersCookie)?.value;
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as DemoOrder[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(reviveDemoOrder).filter(Boolean) as DemoOrder[];
  } catch {
    return [];
  }
}

async function writeDemoOrders(orders: DemoOrder[]) {
  const cookieStore = await cookies();
  cookieStore.set(demoOrdersCookie, JSON.stringify(orders), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

function reviveDemoOrder(order: DemoOrder): DemoOrder | null {
  if (!order?.orderNumber) return null;
  const createdAt = new Date(order.createdAt);
  const updatedAt = new Date(order.updatedAt);
  const paidAt = order.payment?.paidAt ? new Date(order.payment.paidAt) : null;

  return {
    ...order,
    createdAt,
    updatedAt,
    trackingUpdatedAt: order.trackingUpdatedAt ? new Date(order.trackingUpdatedAt) : null,
    shippingAddress: {
      ...order.shippingAddress,
      createdAt: new Date(order.shippingAddress.createdAt),
      updatedAt: new Date(order.shippingAddress.updatedAt),
    },
    payment: {
      ...order.payment,
      paidAt,
      refundedAt: order.payment?.refundedAt ? new Date(order.payment.refundedAt) : null,
      createdAt: new Date(order.payment.createdAt),
      updatedAt: new Date(order.payment.updatedAt),
    },
    items: order.items.map((item) => ({ ...item, createdAt: new Date(item.createdAt) })),
    returnRequests: order.returnRequests.map((request) => ({ ...request, createdAt: new Date(request.createdAt) })),
  };
}

function getSeedDemoOrders(): DemoOrder[] {
  const now = new Date();
  return adminOrders.slice(0, 2).map((order, index) => {
    const product = fallbackProducts[index] ?? fallbackProducts[0];
    const variant = product.variants[0];
    const createdAt = new Date(now);
    createdAt.setDate(now.getDate() - (order.daysAgo ?? index));
    const status = normalizeDemoStatus(order.status);
    const paymentStatus = normalizeDemoPayment(order.payment);
    const orderId = `demo-seed-${order.id}`;

    return {
      id: orderId,
      orderNumber: order.id,
      userId: "demo-customer",
      status,
      subtotal: Math.max(0, order.total - 18000),
      discountTotal: 0,
      shippingCost: 18000,
      shippingProvider: "JNE",
      shippingService: "REG",
      shippingEstimate: "2-4 hari",
      trackingNumber: status === "SHIPPED" || status === "DELIVERED" ? `ZIM${String(20260000 + index)}` : null,
      trackingStatus: null,
      trackingUpdatedAt: null,
      grandTotal: order.total,
      customerName: order.customer,
      customerEmail: "customer@zimeirahijab.test",
      customerPhone: "+6281234567890",
      shippingAddress: {
        id: `demo-seed-address-${order.id}`,
        userId: "demo-customer",
        label: null,
        recipient: order.customer,
        phone: "+6281234567890",
        province: "Sumatera Selatan",
        city: "Pagar Alam",
        district: "Pagar Alam Utara",
        postalCode: "31518",
        addressLine: "Jl. Demo Portfolio No. 26, Pagar Alam",
        createdAt,
        updatedAt: createdAt,
      },
      payment: {
        id: `demo-seed-payment-${order.id}`,
        orderId,
        provider: "MANUAL_TRANSFER",
        status: paymentStatus,
        amount: order.total,
        method: "Manual Transfer Demo",
        instructions: "Order contoh portfolio. Gunakan tombol pembayaran demo jika status masih UNPAID.",
        transactionId: `DEMO-${order.id}`,
        paymentUrl: null,
        paidAt: paymentStatus === "PAID" ? createdAt : null,
        refundedAt: paymentStatus === "REFUNDED" ? createdAt : null,
        refundReason: null,
        createdAt,
        updatedAt: createdAt,
      },
      items: [
        {
          id: `demo-seed-item-${order.id}`,
          orderId,
          productId: product.id,
          variantId: variant.sku,
          productName: product.name,
          variantName: `${variant.color} / ${variant.material}`,
          quantity: order.itemCount,
          price: Math.max(1, Math.floor((order.total - 18000) / order.itemCount)),
          createdAt,
        },
      ],
      returnRequests: [],
      createdAt,
      updatedAt: createdAt,
    };
  });
}

function normalizeDemoStatus(status: string): DemoOrderStatus {
  if (status === "COMPLETED") return "DELIVERED";
  if (status === "CANCELED") return "CANCELLED";
  if (["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].includes(status)) {
    return status as DemoOrderStatus;
  }
  return "PENDING";
}

function normalizeDemoPayment(status: string): DemoPaymentStatus {
  if (["UNPAID", "PAID", "FAILED", "EXPIRED", "REFUNDED"].includes(status)) {
    return status as DemoPaymentStatus;
  }
  return "UNPAID";
}
