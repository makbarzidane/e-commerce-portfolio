import { createHash } from "node:crypto";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getCloudinaryUploadConfig } from "@/lib/integrations/upload";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);

function signUpload(params: Record<string, string>, apiSecret: string) {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const limit = rateLimit({ key: `upload:${ip}`, limit: 20, windowMs: 60 * 1000 });
  if (!limit.ok) {
    return NextResponse.json({ error: "Terlalu banyak upload. Coba lagi sebentar." }, { status: 429 });
  }

  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = getCloudinaryUploadConfig();
  if (!config.isConfigured) {
    return NextResponse.json(
      { error: "Cloudinary belum dikonfigurasi. Isi CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET." },
      { status: 503 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File gambar wajib diunggah." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Format gambar harus JPG, PNG, WEBP, atau SVG." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Ukuran gambar maksimal 5 MB." }, { status: 400 });
  }

  const timestamp = String(Math.floor(Date.now() / 1000));
  const folder = "zimeira-products";
  const signature = signUpload({ folder, timestamp }, config.apiSecret);
  const uploadForm = new FormData();
  uploadForm.append("file", file);
  uploadForm.append("api_key", config.apiKey);
  uploadForm.append("timestamp", timestamp);
  uploadForm.append("folder", folder);
  uploadForm.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
    method: "POST",
    body: uploadForm,
  });

  const result = await response.json();

  if (!response.ok) {
    return NextResponse.json({ error: result.error?.message ?? "Upload Cloudinary gagal." }, { status: response.status });
  }

  return NextResponse.json({
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
  });
}
