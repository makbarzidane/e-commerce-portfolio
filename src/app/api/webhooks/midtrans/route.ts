import crypto from "crypto";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { sendOrderEmail } from "@/lib/email";
import { getPrisma } from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const limit = rateLimit({ key: `midtrans-webhook:${ip}`, limit: 120, windowMs: 60 * 1000 });
  if (!limit.ok) {
    return NextResponse.json({ ok: false, message: "Rate limit" }, { status: 429 });
  }

  const payload = await request.json().catch(() => null);

  if (!payload) {
    return NextResponse.json({ ok: false, message: "Invalid payload" }, { status: 400 });
  }

  if (!process.env.MIDTRANS_SERVER_KEY) {
    return NextResponse.json({ ok: false, message: "MIDTRANS_SERVER_KEY belum dikonfigurasi" }, { status: 503 });
  }

  const orderId = String(payload.order_id ?? "");
  const statusCode = String(payload.status_code ?? "");
  const grossAmount = String(payload.gross_amount ?? "");
  const signatureKey = String(payload.signature_key ?? "");

  if (!orderId || !statusCode || !grossAmount || !signatureKey) {
    return NextResponse.json({ ok: false, message: "Payload Midtrans tidak lengkap" }, { status: 400 });
  }

  const expectedSignature = crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${process.env.MIDTRANS_SERVER_KEY}`)
    .digest("hex");

  if (signatureKey !== expectedSignature) {
    return NextResponse.json({ ok: false, message: "Signature Midtrans tidak valid" }, { status: 401 });
  }

  const paymentStatus = mapMidtransPaymentStatus(String(payload.transaction_status ?? ""), String(payload.fraud_status ?? ""));
  const orderStatus = paymentStatus === PaymentStatus.PAID ? OrderStatus.PROCESSING : undefined;

  const order = await getPrisma().order.findUnique({
    where: { orderNumber: orderId },
    select: { id: true, userId: true, customerEmail: true, customerName: true, orderNumber: true },
  });

  if (!order) {
    return NextResponse.json({ ok: false, message: "Order tidak ditemukan" }, { status: 404 });
  }

  await getPrisma().order.update({
    where: { id: order.id },
    data: {
      status: orderStatus,
      payment: {
        update: {
          status: paymentStatus,
          transactionId: String(payload.transaction_id ?? payload.transaction_time ?? payload.order_id ?? ""),
          paidAt: paymentStatus === PaymentStatus.PAID ? new Date() : undefined,
        },
      },
    },
  });

  if (paymentStatus === PaymentStatus.PAID) {
    await sendOrderEmail({
      to: order.customerEmail,
      userId: order.userId,
      orderId: order.id,
      subject: `Pembayaran ${order.orderNumber} diterima`,
      message: `Halo ${order.customerName}, pembayaran pesanan ${order.orderNumber} sudah diterima otomatis dari Midtrans. Pesanan akan segera diproses.`,
    });
  }
  if (paymentStatus === PaymentStatus.REFUNDED) {
    await sendOrderEmail({
      to: order.customerEmail,
      userId: order.userId,
      orderId: order.id,
      subject: `Refund ${order.orderNumber} diproses`,
      message: `Halo ${order.customerName}, refund untuk pesanan ${order.orderNumber} sudah diproses.`,
    });
  }

  return NextResponse.json({ ok: true, message: "Webhook Midtrans berhasil diproses" });
}

function mapMidtransPaymentStatus(transactionStatus: string, fraudStatus: string) {
  if (transactionStatus === "capture") {
    return fraudStatus === "challenge" ? PaymentStatus.UNPAID : PaymentStatus.PAID;
  }
  if (transactionStatus === "settlement") return PaymentStatus.PAID;
  if (transactionStatus === "pending") return PaymentStatus.UNPAID;
  if (transactionStatus === "expire") return PaymentStatus.EXPIRED;
  if (transactionStatus === "refund" || transactionStatus === "partial_refund") return PaymentStatus.REFUNDED;
  return PaymentStatus.FAILED;
}
