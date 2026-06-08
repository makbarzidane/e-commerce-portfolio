import { NotificationChannel, NotificationStatus } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";

type OrderEmailInput = {
  to: string;
  subject: string;
  message: string;
  orderId?: string;
  userId?: string | null;
};

export async function sendOrderEmail(input: OrderEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "Zimeira Hijab Store <onboarding@resend.dev>";

  if (!apiKey) {
    await logNotification({ ...input, status: NotificationStatus.PENDING, error: "RESEND_API_KEY belum diisi" });
    return { ok: false, skipped: true };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        html: buildEmailHtml(input.message),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      await logNotification({ ...input, status: NotificationStatus.FAILED, error });
      return { ok: false, error };
    }

    await logNotification({ ...input, status: NotificationStatus.SENT });
    return { ok: true };
  } catch (error) {
    await logNotification({ ...input, status: NotificationStatus.FAILED, error: (error as Error).message });
    return { ok: false, error: (error as Error).message };
  }
}

function buildEmailHtml(message: string) {
  return `
    <div style="font-family: Arial, sans-serif; color: #2a2521; line-height: 1.6;">
      <h2 style="color: #9b6870;">Zimeira Hijab Store</h2>
      <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
      <p style="font-size: 12px; color: #7c6860;">Email otomatis dari demo ecommerce Zimeira Hijab Store.</p>
    </div>
  `;
}

async function logNotification(input: OrderEmailInput & { status: NotificationStatus; error?: string }) {
  try {
    await getPrisma().notificationLog.create({
      data: {
        userId: input.userId,
        orderId: input.orderId,
        channel: NotificationChannel.EMAIL,
        status: input.status,
        subject: input.subject,
        message: input.message,
        target: input.to,
        error: input.error,
        sentAt: input.status === NotificationStatus.SENT ? new Date() : undefined,
      },
    });
  } catch (error) {
    console.warn("[email-log]", error);
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
