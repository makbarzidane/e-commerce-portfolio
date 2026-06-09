import { getDemoOrderByNumber } from "@/lib/demo-orders";
import { getPrisma } from "@/lib/prisma";

export async function getOrderByNumber(orderNumber: string) {
  try {
    return await getPrisma().order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
        payment: true,
        shippingAddress: true,
        returnRequests: { orderBy: { createdAt: "desc" } },
      },
    });
  } catch {
    return getDemoOrderByNumber(orderNumber);
  }
}
