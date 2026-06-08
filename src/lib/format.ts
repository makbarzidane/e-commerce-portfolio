export function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getDiscountPercent(normalPrice: number, discountPrice?: number | null) {
  if (!discountPrice || discountPrice >= normalPrice) return 0;
  return Math.round(((normalPrice - discountPrice) / normalPrice) * 100);
}
