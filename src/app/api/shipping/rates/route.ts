import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getShippingRates } from "@/lib/integrations/shipping";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const limit = rateLimit({ key: `shipping:${ip}`, limit: 30, windowMs: 60 * 1000 });
  if (!limit.ok) {
    return Response.json({ error: "Terlalu banyak cek ongkir. Coba lagi sebentar." }, { status: 429 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const destinationPostalCode = String(payload?.destinationPostalCode ?? "").replace(/\D/g, "");
  const weightGram = Number(payload?.weightGram ?? 500);

  if (destinationPostalCode.length < 5) {
    return Response.json({ error: "Kode pos tujuan wajib diisi." }, { status: 400 });
  }

  const rates = await getShippingRates({
    originCity: process.env.SHIPPING_ORIGIN_CITY ?? "Jakarta",
    destinationCity: String(payload?.destinationCity ?? ""),
    originPostalCode: process.env.SHIPPING_ORIGIN_POSTAL_CODE,
    destinationPostalCode,
    weightGram: Number.isFinite(weightGram) ? Math.max(500, weightGram) : 500,
  });

  return Response.json({ rates });
}
