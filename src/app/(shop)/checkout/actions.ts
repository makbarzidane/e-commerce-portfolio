"use server";

import { PaymentStatus, StockMovementType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getOrCreateCart } from "@/lib/cart";
import { sendOrderEmail } from "@/lib/email";
import { createPayment } from "@/lib/integrations/payment";
import { findShippingRate, getShippingRates } from "@/lib/integrations/shipping";
import { getPrisma } from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

function orderNumber() {
  return `ZMS-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
}

function calculateDiscount(subtotal: number, coupon: { discountPercent: number | null; discountAmount: number | null }) {
  if (coupon.discountPercent) {
    return Math.min(subtotal, Math.floor((subtotal * coupon.discountPercent) / 100));
  }

  return Math.min(subtotal, coupon.discountAmount ?? 0);
}

function isValidPhone(value: string) {
  return /^\+628[0-9]{8,12}$/.test(normalizePhone(value));
}

function isValidPostalCode(value: string) {
  return /^[0-9]{5}$/.test(value);
}

export async function createCheckoutOrder(formData: FormData) {
  const session = await getServerSession(authOptions);
  const headerStore = await headers();
  const ip = getClientIp(headerStore);
  const limit = rateLimit({ key: `checkout:${session?.user?.id ?? ip}`, limit: 8, windowMs: 10 * 60 * 1000 });
  let target = "/pesanan?created=1";

  if (!session?.user?.id) {
    redirect("/keranjang?auth=required");
  }

  if (!process.env.DATABASE_URL) {
    redirect("/keranjang?checkout=demo");
  }

  if (!limit.ok) {
    redirect("/checkout?error=rate-limit");
  }

  try {
    const user = await getPrisma().user.findUnique({
      where: { id: session.user.id },
      select: { phone: true, phoneVerifiedAt: true },
    });
    if (!user?.phone || !user.phoneVerifiedAt) {
      target = "/akun?verifyPhone=required";
      throw new Error("PHONE_UNVERIFIED");
    }

    const customerName = String(formData.get("customerName") ?? session.user.name ?? "Customer Zimeira").trim();
    const customerEmail = String(formData.get("customerEmail") ?? session.user.email ?? "").trim();
    const customerPhone = normalizePhone(String(formData.get("customerPhone") ?? "").trim());
    const province = String(formData.get("province") ?? "").trim();
    const city = String(formData.get("city") ?? "").trim();
    const district = String(formData.get("district") ?? "").trim();
    const postalCode = String(formData.get("postalCode") ?? "").trim();
    const addressLine = String(formData.get("addressLine") ?? "").trim();
    const shippingRateId = String(formData.get("shippingRateId") ?? "");
    const paymentMethodId = String(formData.get("paymentMethodId") ?? "manual-transfer");
    const couponCode = String(formData.get("couponCode") ?? "").trim().toUpperCase();

    if (!customerName || !customerEmail || !isValidPhone(customerPhone) || !province || !city || !district || !isValidPostalCode(postalCode) || addressLine.length < 10) {
      target = "/checkout?error=address";
      throw new Error("INVALID_ADDRESS");
    }

    if (customerPhone !== user.phone) {
      target = "/checkout?error=phone";
      throw new Error("PHONE_MISMATCH");
    }

    const cart = await getOrCreateCart(true);
    if (!cart) {
      target = "/keranjang";
      throw new Error("EMPTY_CART");
    }
    const cartItems = await getPrisma().cartItem.findMany({
      where: { cartId: cart.id },
      include: { product: true, variant: true },
    });

    if (!cartItems.length) {
      target = "/keranjang";
      throw new Error("EMPTY_CART");
    }

    const orderItems = cartItems.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      productName: item.product.name,
      variantName: item.variant ? `${item.variant.color} / ${item.variant.material}` : undefined,
      quantity: item.quantity,
      price: item.price,
    }));

    const subtotal = orderItems.reduce((total, item) => total + item.price * item.quantity, 0);
    const weightGram = Math.max(500, cartItems.reduce((total, item) => total + item.quantity * 250, 0));
    const serverRates = await getShippingRates({
      originCity: process.env.SHIPPING_ORIGIN_CITY ?? "Pagar Alam",
      destinationCity: city,
      originPostalCode: process.env.SHIPPING_ORIGIN_POSTAL_CODE,
      destinationPostalCode: postalCode,
      weightGram,
    });
    const shippingRate = serverRates.find((rate) => rate.id === shippingRateId) ?? findShippingRate(shippingRateId);
    const now = new Date();
    const coupon = couponCode
      ? await getPrisma().coupon.findFirst({
          where: {
            code: couponCode,
            isActive: true,
            minPurchase: { lte: subtotal },
            OR: [{ startsAt: null }, { startsAt: { lte: now } }],
            AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
          },
        })
      : null;

    if (couponCode && (!coupon || (coupon.quota !== null && coupon.quota <= 0) || (!coupon.discountPercent && !coupon.discountAmount))) {
      target = "/checkout?error=coupon";
      throw new Error("INVALID_COUPON");
    }

    const discountTotal = coupon ? calculateDiscount(subtotal, coupon) : 0;
    const grandTotal = Math.max(0, subtotal - discountTotal) + shippingRate.cost;
    const currentOrderNumber = orderNumber();
    const payment = await createPayment({
      orderNumber: currentOrderNumber,
      amount: grandTotal,
      customerName,
      customerEmail,
      methodId: paymentMethodId,
    });

    const order = await getPrisma().$transaction(async (tx) => {
      const freshItems = await tx.cartItem.findMany({
        where: { cartId: cart.id },
        include: { product: true, variant: true },
      });

      if (!freshItems.length) {
        throw new Error("EMPTY_CART");
      }

      for (const item of freshItems) {
        if (!item.product.isActive || !item.variant || !item.variant.isActive || item.variant.stock < item.quantity) {
          throw new Error("STOCK_UNAVAILABLE");
        }
      }

      const address = await tx.shippingAddress.create({
        data: {
          userId: session.user.id,
          recipient: customerName,
          phone: customerPhone,
          province,
          city,
          district,
          postalCode,
          addressLine,
        },
      });

      const createdOrder = await tx.order.create({
        data: {
          orderNumber: currentOrderNumber,
          userId: session.user.id,
          customerName,
          customerEmail,
          customerPhone,
          shippingAddressId: address.id,
          subtotal,
          discountTotal,
          couponId: coupon?.id,
          shippingCost: shippingRate.cost,
          shippingProvider: shippingRate.provider,
          shippingService: shippingRate.service,
          shippingEstimate: shippingRate.etd,
          grandTotal,
          items: { create: orderItems },
          payment: {
            create: {
              amount: grandTotal,
              provider: payment.provider,
              method: payment.method,
              status: PaymentStatus.UNPAID,
              transactionId: payment.transactionId,
              paymentUrl: payment.paymentUrl,
              instructions: payment.instructions,
            },
          },
        },
      });

      for (const item of freshItems) {
        const stockBefore = item.variant!.stock;
        const stockAfter = stockBefore - item.quantity;

        await tx.productVariant.update({
          where: { id: item.variant!.id },
          data: { stock: { decrement: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            variantId: item.variant!.id,
            orderId: createdOrder.id,
            type: StockMovementType.OUT,
            quantity: item.quantity,
            stockBefore,
            stockAfter,
            note: `Checkout order ${createdOrder.orderNumber}`,
          },
        });
      }

      if (coupon?.quota !== null && coupon?.quota !== undefined) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { quota: Math.max(0, coupon.quota - 1) },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return createdOrder;
    });

    await sendOrderEmail({
      to: customerEmail,
      userId: session.user.id,
      orderId: order.id,
      subject: `Pesanan ${order.orderNumber} berhasil dibuat`,
      message: `Halo ${customerName}, pesanan ${order.orderNumber} berhasil dibuat. Total pembayaran ${grandTotal.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}.`,
    });

    target = `/checkout/sukses/${order.orderNumber}`;
  } catch (error) {
    if ((error as Error).message === "STOCK_UNAVAILABLE") {
      target = "/checkout?error=stock";
    } else if ((error as Error).message === "INVALID_COUPON") {
      target = "/checkout?error=coupon";
    } else if ((error as Error).message === "INVALID_ADDRESS") {
      target = "/checkout?error=address";
    } else if ((error as Error).message === "PHONE_MISMATCH") {
      target = "/checkout?error=phone";
    } else if ((error as Error).message !== "EMPTY_CART" && (error as Error).message !== "PHONE_UNVERIFIED") {
      target = "/checkout?error=database";
    }
  }

  redirect(target);
}

function normalizePhone(value: string) {
  const digits = value.replace(/[^\d+]/g, "");
  if (digits.startsWith("+62")) return digits;
  if (digits.startsWith("62")) return `+${digits}`;
  if (digits.startsWith("0")) return `+62${digits.slice(1)}`;
  return digits;
}
