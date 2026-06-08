import type { PaymentProvider } from "@prisma/client";

export type PaymentMethod = {
  id: string;
  provider: PaymentProvider;
  label: string;
  description: string;
  instructions: string;
};

export const paymentMethods: PaymentMethod[] = [
  {
    id: "manual-transfer",
    provider: "MANUAL_TRANSFER",
    label: "Manual Transfer",
    description: "Konfirmasi manual oleh admin setelah pembayaran diterima.",
    instructions: "Transfer ke rekening demo BSI 700-123-4567 a.n. Zimeira Hijab Store. Masukkan nomor order pada berita transfer.",
  },
  {
    id: "midtrans-snap",
    provider: "MIDTRANS",
    label: "Midtrans Snap",
    description: "Siap untuk kartu, e-wallet, VA, dan QRIS setelah API key diisi.",
    instructions: "Pembayaran Midtrans belum aktif karena key belum dikonfigurasi. Saat production, customer akan diarahkan ke halaman pembayaran Midtrans.",
  },
];

type CreatePaymentInput = {
  orderNumber: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  methodId: string;
};

export function findPaymentMethod(methodId: string) {
  return paymentMethods.find((method) => method.id === methodId) ?? paymentMethods[0];
}

export async function createPayment(input: CreatePaymentInput) {
  const method = findPaymentMethod(input.methodId);

  if (method.provider === "MIDTRANS" && process.env.MIDTRANS_SERVER_KEY && process.env.MIDTRANS_CLIENT_KEY) {
    const endpoint = isMidtransProduction()
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${process.env.MIDTRANS_SERVER_KEY}:`).toString("base64")}`,
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: input.orderNumber,
          gross_amount: input.amount,
        },
        customer_details: {
          first_name: input.customerName,
          email: input.customerEmail,
        },
        credit_card: {
          secure: true,
        },
      }),
    });

    if (!response.ok) {
      const message = await response.text().catch(() => "");
      throw new Error(`MIDTRANS_CREATE_FAILED:${message}`);
    }

    const payload = (await response.json()) as { token?: string; redirect_url?: string };

    return {
      provider: "MIDTRANS" as const,
      method: method.label,
      paymentUrl: payload.redirect_url ?? null,
      transactionId: payload.token ?? `MIDTRANS-${input.orderNumber}`,
      instructions: "Klik tombol Bayar Sekarang untuk membuka halaman pembayaran Midtrans.",
    };
  }

  return {
    provider: method.provider === "MIDTRANS" ? ("MANUAL_TRANSFER" as const) : method.provider,
    method: method.provider === "MIDTRANS" ? "Manual Transfer" : method.label,
    paymentUrl: null,
    transactionId: `MANUAL-${input.orderNumber}`,
    instructions:
      method.provider === "MIDTRANS"
        ? "Midtrans belum dikonfigurasi. Order dialihkan ke manual transfer demo."
        : method.instructions,
  };
}

function isMidtransProduction() {
  return process.env.MIDTRANS_IS_PRODUCTION === "true" || process.env.NODE_ENV === "production";
}
