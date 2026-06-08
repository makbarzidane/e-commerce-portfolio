"use server";

import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { setFlashToast } from "@/lib/flash-toast";
import { sendPhoneOtp } from "@/lib/otp";
import { getPrisma } from "@/lib/prisma";

export async function updateCustomerProfile(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/akun");
  }

  const name = String(formData.get("name") ?? "").trim();
  const phone = normalizePhone(String(formData.get("phone") ?? "").trim());
  const image = String(formData.get("image") ?? "").trim();
  const recipient = String(formData.get("recipient") ?? name).trim();
  const province = String(formData.get("province") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const district = String(formData.get("district") ?? "").trim();
  const postalCode = String(formData.get("postalCode") ?? "").trim();
  const addressLine = String(formData.get("addressLine") ?? "").trim();

  if (!name) return;

  await getPrisma().$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: session.user.id },
      select: { phone: true },
    });

    await tx.user.update({
      where: { id: session.user.id },
      data: {
        name,
        phone: phone || null,
        phoneVerifiedAt: phone && phone === user?.phone ? undefined : null,
        image: image || null,
      },
    });

    if (!recipient || !phone || !province || !city || !district || !postalCode || !addressLine) {
      return;
    }

    const latestAddress = await tx.shippingAddress.findFirst({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    });

    const addressData = {
      label: "Alamat utama",
      recipient,
      phone,
      province,
      city,
      district,
      postalCode,
      addressLine,
      isDefault: true,
    };

    if (latestAddress) {
      await tx.shippingAddress.update({
        where: { id: latestAddress.id },
        data: addressData,
      });
    } else {
      await tx.shippingAddress.create({
        data: {
          userId: session.user.id,
          ...addressData,
        },
      });
    }
  });

  revalidatePath("/akun");
  revalidatePath("/checkout");
  await setFlashToast("Profil berhasil disimpan.");
}

export async function requestPhoneVerification(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/akun");
  }

  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  if (!isValidIndonesianPhone(phone)) {
    await setFlashToast("Nomor HP belum valid. Gunakan nomor Indonesia aktif.", "error");
    redirect("/akun");
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await getPrisma().$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: session.user.id },
      select: { phone: true },
    });

    await tx.user.update({
      where: { id: session.user.id },
      data: {
        phone,
        phoneVerifiedAt: user?.phone === phone ? undefined : null,
      },
    });

    await tx.phoneVerification.updateMany({
      where: { userId: session.user.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    await tx.phoneVerification.create({
      data: {
        userId: session.user.id,
        phone,
        codeHash,
        expiresAt,
      },
    });
  });

  revalidatePath("/akun");
  const otpResult = await sendPhoneOtp({ userId: session.user.id, phone, code });
  if (otpResult.ok) {
    await setFlashToast("Kode verifikasi sudah dikirim ke nomor HP.");
  } else {
    await setFlashToast(`Kode verifikasi mode development: ${code}. Isi FONNTE_API_KEY untuk kirim OTP real.`, "info");
  }
  redirect("/akun");
}

export async function verifyPhoneCode(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/akun");
  }

  const code = String(formData.get("code") ?? "").trim();
  if (!/^[0-9]{6}$/.test(code)) {
    await setFlashToast("Kode verifikasi harus 6 digit.", "error");
    redirect("/akun");
  }

  const verification = await getPrisma().phoneVerification.findFirst({
    where: {
      userId: session.user.id,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!verification || verification.attempts >= 5) {
    await setFlashToast("Kode verifikasi sudah tidak aktif. Minta kode baru.", "error");
    redirect("/akun");
  }

  const isValid = await bcrypt.compare(code, verification.codeHash);
  if (!isValid) {
    await getPrisma().phoneVerification.update({
      where: { id: verification.id },
      data: { attempts: { increment: 1 } },
    });
    await setFlashToast("Kode verifikasi salah.", "error");
    redirect("/akun");
  }

  await getPrisma().$transaction([
    getPrisma().user.update({
      where: { id: session.user.id },
      data: {
        phone: verification.phone,
        phoneVerifiedAt: new Date(),
      },
    }),
    getPrisma().phoneVerification.update({
      where: { id: verification.id },
      data: { consumedAt: new Date() },
    }),
  ]);

  revalidatePath("/akun");
  revalidatePath("/checkout");
  await setFlashToast("Nomor HP berhasil diverifikasi.");
  redirect("/akun");
}

function normalizePhone(value: string) {
  const digits = value.replace(/[^\d+]/g, "");
  if (digits.startsWith("+62")) return digits;
  if (digits.startsWith("62")) return `+${digits}`;
  if (digits.startsWith("0")) return `+62${digits.slice(1)}`;
  return digits;
}

function isValidIndonesianPhone(value: string) {
  return /^\+628[0-9]{8,12}$/.test(value);
}
