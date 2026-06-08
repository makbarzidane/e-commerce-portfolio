"use server";

import { ReturnStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { setFlashToast } from "@/lib/flash-toast";
import { getPrisma } from "@/lib/prisma";

export async function requestReturn(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/pesanan");
  }

  const orderNumber = String(formData.get("orderNumber") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!orderNumber || reason.length < 10) {
    redirect(`/pesanan/${orderNumber}?error=return-validation`);
  }

  const order = await getPrisma().order.findFirst({
    where: { orderNumber, userId: session.user.id },
    include: { returnRequests: true },
  });

  if (!order || order.returnRequests.some((item) => item.status !== ReturnStatus.CANCELLED && item.status !== ReturnStatus.REJECTED)) {
    redirect(`/pesanan/${orderNumber}?error=return-exists`);
  }

  await getPrisma().returnRequest.create({
    data: {
      orderId: order.id,
      userId: session.user.id,
      reason,
    },
  });

  revalidatePath(`/pesanan/${orderNumber}`);
  revalidatePath("/pesanan");
  await setFlashToast("Pengajuan retur berhasil dikirim.");
  redirect(`/pesanan/${orderNumber}?return=requested`);
}

export async function submitProductReview(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/pesanan");
  }

  const orderNumber = String(formData.get("orderNumber") ?? "").trim();
  const productId = String(formData.get("productId") ?? "").trim();
  const rating = Number.parseInt(String(formData.get("rating") ?? ""), 10);
  const comment = String(formData.get("comment") ?? "").trim();

  if (!orderNumber || !productId || !Number.isFinite(rating) || rating < 1 || rating > 5 || comment.length < 5) {
    redirect(`/pesanan/${orderNumber}?error=review-validation`);
  }

  const order = await getPrisma().order.findFirst({
    where: {
      orderNumber,
      userId: session.user.id,
      status: { in: ["SHIPPED", "DELIVERED"] },
      items: { some: { productId } },
    },
    select: { id: true },
  });

  if (!order) {
    redirect(`/pesanan/${orderNumber}?error=review-unavailable`);
  }

  const existingReview = await getPrisma().review.findFirst({
    where: { userId: session.user.id, productId },
    select: { id: true },
  });

  if (existingReview) {
    redirect(`/pesanan/${orderNumber}?error=review-exists`);
  }

  await getPrisma().review.create({
    data: {
      userId: session.user.id,
      productId,
      rating,
      comment,
    },
  });

  revalidatePath(`/pesanan/${orderNumber}`);
  revalidatePath("/produk");
  await setFlashToast("Review produk berhasil disimpan.");
  redirect(`/pesanan/${orderNumber}?review=saved`);
}
