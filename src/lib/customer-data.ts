import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { mapProduct } from "@/lib/store-data";

export async function getCurrentCustomer() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  try {
    return await getPrisma().user.findUnique({
      where: { id: session.user.id },
      include: {
        shippingAddresses: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { orders: true, wishlistItems: true } },
      },
    });
  } catch {
    return null;
  }
}

export async function getCustomerOrders() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  try {
    const orders = await getPrisma().order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { items: true, payment: true },
    });

    return orders.map((order) => ({
      id: order.orderNumber,
      date: order.createdAt.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
      status: order.status,
      paymentStatus: order.payment?.status ?? "UNPAID",
      trackingNumber: order.trackingNumber,
      shippingProvider: order.shippingProvider,
      shippingService: order.shippingService,
      shippingEstimate: order.shippingEstimate,
      total: order.grandTotal,
      items: order.items.reduce((total, item) => total + item.quantity, 0),
    }));
  } catch {
    return [];
  }
}

export async function getCustomerWishlist() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  try {
    const wishlist = await getPrisma().wishlist.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          include: {
            category: true,
            images: { orderBy: { sortOrder: "asc" } },
            variants: { orderBy: { createdAt: "asc" } },
          },
        },
      },
    });

    return wishlist.filter((item) => item.product.isActive).map((item) => mapProduct(item.product));
  } catch {
    return [];
  }
}
