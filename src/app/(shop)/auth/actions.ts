"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sendOrderEmail } from "@/lib/email";
import { getPrisma } from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export async function registerCustomer(formData: FormData) {
  const headerStore = await headers();
  const ip = getClientIp(headerStore);
  const limit = rateLimit({ key: `register:${ip}`, limit: 5, windowMs: 15 * 60 * 1000 });
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/");
  const loginTarget = `/auth/login?registered=1&callbackUrl=${encodeURIComponent(callbackUrl)}`;

  if (!limit.ok) {
    redirect(`/auth/login?mode=register&error=rate-limit&callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  if (!name || !email || password.length < 8) {
    redirect(`/auth/login?mode=register&error=register-validation&callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  if (!isLikelyRealEmail(email)) {
    redirect(`/auth/login?mode=register&error=email-real-required&callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const existingUser = await getPrisma().user.findUnique({ where: { email } });
  if (existingUser) {
    redirect(`/auth/login?mode=register&error=email-exists&callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await getPrisma().user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  redirect(loginTarget);
}

export async function requestPasswordResetCode(formData: FormData) {
  const headerStore = await headers();
  const ip = getClientIp(headerStore);
  const limit = rateLimit({ key: `password-reset-request:${ip}`, limit: 5, windowMs: 15 * 60 * 1000 });
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!limit.ok) {
    redirect("/auth/reset-password?error=rate-limit");
  }

  if (!isValidEmailSyntax(email)) {
    redirect("/auth/reset-password?sent=1");
  }

  const user = await getPrisma().user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true },
  });

  if (user) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await getPrisma().$transaction([
      getPrisma().passwordResetCode.updateMany({
        where: { email, consumedAt: null },
        data: { consumedAt: new Date() },
      }),
      getPrisma().passwordResetCode.create({
        data: {
          userId: user.id,
          email,
          codeHash,
          expiresAt,
        },
      }),
    ]);

    const sendResult = await sendOrderEmail({
      to: user.email,
      userId: user.id,
      subject: "Kode reset password Zimeira Hijab Store",
      message: `Halo ${user.name ?? "Customer Zimeira"},\n\nKode reset password Anda adalah ${code}.\nKode ini berlaku selama 15 menit. Abaikan email ini jika Anda tidak meminta reset password.`,
    });

    const devCode = process.env.NODE_ENV !== "production" ? `&devCode=${encodeURIComponent(code)}` : "";
    const sendStatus = sendResult.ok ? "sent" : "email-failed";
    redirect(`/auth/reset-password?sent=1&status=${sendStatus}&email=${encodeURIComponent(email)}${devCode}`);
  }

  redirect(`/auth/reset-password?sent=1&email=${encodeURIComponent(email)}`);
}

export async function resetPasswordWithCode(formData: FormData) {
  const headerStore = await headers();
  const ip = getClientIp(headerStore);
  const limit = rateLimit({ key: `password-reset-confirm:${ip}`, limit: 8, windowMs: 15 * 60 * 1000 });
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const code = String(formData.get("code") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!limit.ok) {
    redirect(`/auth/reset-password?error=rate-limit&email=${encodeURIComponent(email)}`);
  }

  if (!email || !/^[0-9]{6}$/.test(code) || password.length < 8) {
    redirect(`/auth/reset-password?error=reset-validation&email=${encodeURIComponent(email)}`);
  }

  const resetCode = await getPrisma().passwordResetCode.findFirst({
    where: {
      email,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  if (!resetCode?.user || resetCode.attempts >= 5) {
    redirect(`/auth/reset-password?error=code-invalid&email=${encodeURIComponent(email)}`);
  }

  const isValid = await bcrypt.compare(code, resetCode.codeHash);
  if (!isValid) {
    await getPrisma().passwordResetCode.update({
      where: { id: resetCode.id },
      data: { attempts: { increment: 1 } },
    });
    redirect(`/auth/reset-password?error=code-invalid&email=${encodeURIComponent(email)}`);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await getPrisma().$transaction([
    getPrisma().user.update({
      where: { id: resetCode.user.id },
      data: {
        password: hashedPassword,
        emailVerified: resetCode.user.emailVerified ?? new Date(),
      },
    }),
    getPrisma().passwordResetCode.update({
      where: { id: resetCode.id },
      data: { consumedAt: new Date() },
    }),
  ]);

  redirect("/auth/login?reset=success");
}

function isLikelyRealEmail(email: string) {
  const match = /^[^\s@]+@([^\s@]+\.[^\s@]+)$/.exec(email);
  if (!match) return false;

  const domain = match[1].toLowerCase();
  const blockedDomains = new Set([
    "example.com",
    "example.net",
    "example.org",
    "test.com",
    "mailinator.com",
    "tempmail.com",
    "temp-mail.org",
    "10minutemail.com",
    "guerrillamail.com",
    "yopmail.com",
  ]);

  if (domain.endsWith(".test") || domain.endsWith(".local") || domain.endsWith(".invalid")) return false;
  if (blockedDomains.has(domain)) return false;

  return true;
}

function isValidEmailSyntax(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
