export function buildWhatsAppOrderUrl(phone: string | null | undefined, message: string) {
  const normalized = normalizeIndonesiaPhone(phone);
  if (!normalized) return null;

  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

function normalizeIndonesiaPhone(phone: string | null | undefined) {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}
