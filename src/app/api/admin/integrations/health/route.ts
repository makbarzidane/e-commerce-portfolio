import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCloudinaryUploadConfig } from "@/lib/integrations/upload";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cloudinary = getCloudinaryUploadConfig();

  return NextResponse.json({
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    midtrans: Boolean(process.env.MIDTRANS_SERVER_KEY && process.env.MIDTRANS_CLIENT_KEY),
    resend: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
    resendProductionSender: Boolean(process.env.RESEND_FROM_EMAIL && !process.env.RESEND_FROM_EMAIL.includes("onboarding@resend.dev")),
    otp: Boolean(process.env.FONNTE_API_KEY),
    shipping: Boolean(process.env.BITESHIP_API_KEY || process.env.RAJAONGKIR_API_KEY),
    cloudinary: cloudinary.isConfigured,
    nextAuthSecretStrong: Boolean(process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length >= 32 && !process.env.NEXTAUTH_SECRET.includes("replace")),
  });
}
