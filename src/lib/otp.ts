import { NotificationChannel, NotificationStatus } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";

type SendPhoneOtpInput = {
  userId?: string | null;
  phone: string;
  code: string;
};

export async function sendPhoneOtp(input: SendPhoneOtpInput) {
  const message = `Kode verifikasi Zimeira Hijab Store Anda: ${input.code}. Berlaku 10 menit. Jangan bagikan kode ini.`;

  if (process.env.FONNTE_API_KEY) {
    return sendFonnteOtp(input, message);
  }

  await logOtpNotification({
    ...input,
    message,
    status: NotificationStatus.PENDING,
    error: "FONNTE_API_KEY belum diisi",
  });

  return { ok: false, skipped: true, provider: "demo" };
}

async function sendFonnteOtp(input: SendPhoneOtpInput, message: string) {
  try {
    const body = new URLSearchParams({
      target: normalizeFonntePhone(input.phone),
      message,
    });

    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: process.env.FONNTE_API_KEY ?? "",
      },
      body,
    });

    const responseText = await response.text().catch(() => "");

    if (!response.ok) {
      await logOtpNotification({
        ...input,
        message,
        status: NotificationStatus.FAILED,
        error: responseText || "Fonnte gagal mengirim OTP",
      });
      return { ok: false, provider: "fonnte", error: responseText };
    }

    await logOtpNotification({
      ...input,
      message,
      status: NotificationStatus.SENT,
    });
    return { ok: true, provider: "fonnte" };
  } catch (error) {
    await logOtpNotification({
      ...input,
      message,
      status: NotificationStatus.FAILED,
      error: (error as Error).message,
    });
    return { ok: false, provider: "fonnte", error: (error as Error).message };
  }
}

async function logOtpNotification(input: SendPhoneOtpInput & { message: string; status: NotificationStatus; error?: string }) {
  try {
    await getPrisma().notificationLog.create({
      data: {
        userId: input.userId,
        channel: NotificationChannel.WHATSAPP,
        status: input.status,
        subject: "Kode verifikasi nomor HP",
        message: input.message,
        target: input.phone,
        error: input.error,
        sentAt: input.status === NotificationStatus.SENT ? new Date() : undefined,
      },
    });
  } catch (error) {
    console.warn("[otp-log]", error);
  }
}

function normalizeFonntePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
}
