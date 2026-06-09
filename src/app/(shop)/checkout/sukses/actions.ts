"use server";

import { OrderStatus, PaymentStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { markDemoOrderPaid } from "@/lib/demo-orders";
import { getPrisma } from "@/lib/prisma";

export async function simulatePaymentPaid(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const orderNumber = String(formData.get("orderNumber") ?? "");
  if (!orderNumber) return;

  if (!process.env.DATABASE_URL) {
    await markDemoOrderPaid(orderNumber, session.user.id);
    revalidatePath(`/checkout/sukses/${orderNumber}`);
    revalidatePath(`/pesanan/${orderNumber}`);
    revalidatePath("/pesanan");
    revalidatePath("/lacak");
    return;
  }

  const order = await getPrisma().order.findUnique({
    where: { orderNumber },
    include: { payment: true },
  });

  if (!order || order.userId !== session.user.id || !order.payment || order.payment.status === PaymentStatus.PAID) {
    return;
  }

  await getPrisma().order.update({
    where: { id: order.id },
    data: {
      status: order.status === OrderStatus.PENDING ? OrderStatus.PROCESSING : order.status,
      payment: {
        update: {
          status: PaymentStatus.PAID,
          paidAt: new Date(),
        },
      },
    },
  });

  revalidatePath(`/checkout/sukses/${orderNumber}`);
  revalidatePath(`/pesanan/${orderNumber}`);
  revalidatePath("/pesanan");
  revalidatePath("/lacak");
  revalidatePath("/admin");
  revalidatePath("/admin/pesanan");
}
