export type ShippingRate = {
  id: string;
  provider: string;
  service: string;
  label: string;
  description: string;
  etd: string;
  cost: number;
};

type ShippingRateInput = {
  originCity: string;
  destinationCity: string;
  originPostalCode?: string;
  destinationPostalCode?: string;
  weightGram: number;
};

export const fallbackShippingRates: ShippingRate[] = [
  {
    id: "jne-regular",
    provider: "JNE",
    service: "REG",
    label: "JNE REG",
    description: "Layanan reguler untuk pengiriman nasional.",
    etd: "2-4 hari",
    cost: 18000,
  },
  {
    id: "jnt-ez",
    provider: "J&T",
    service: "EZ",
    label: "J&T EZ",
    description: "Pilihan populer untuk pengiriman harian.",
    etd: "1-2 hari",
    cost: 22000,
  },
  {
    id: "sicepat-best",
    provider: "SiCepat",
    service: "BEST",
    label: "SiCepat BEST",
    description: "Estimasi lebih cepat untuk kota besar.",
    etd: "1 hari",
    cost: 32000,
  },
  {
    id: "anteraja-sameday",
    provider: "AnterAja",
    service: "Same Day",
    label: "AnterAja Same Day",
    description: "Area tertentu, dikirim di hari yang sama.",
    etd: "Hari ini",
    cost: 45000,
  },
];

export async function getShippingRates(input: ShippingRateInput) {
  if (process.env.BITESHIP_API_KEY && input.destinationPostalCode) {
    const rates = await getBiteshipRates(input).catch(() => []);
    if (rates.length) return rates;
  }

  if (!process.env.RAJAONGKIR_API_KEY && !process.env.BITESHIP_API_KEY) {
    return fallbackShippingRates;
  }

  // Provider real dapat disambungkan di sini. Shape output sengaja sama dengan fallback.
  return fallbackShippingRates.map((rate) => ({
    ...rate,
    provider: process.env.BITESHIP_API_KEY ? "Biteship" : "RajaOngkir",
    description: `${rate.description} ${input.originCity} ke ${input.destinationCity}, ${input.weightGram} gram.`,
  }));
}

export function findShippingRate(rateId: string) {
  return fallbackShippingRates.find((rate) => rate.id === rateId) ?? fallbackShippingRates[0];
}

async function getBiteshipRates(input: ShippingRateInput): Promise<ShippingRate[]> {
  const response = await fetch("https://api.biteship.com/v1/rates/couriers", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.BITESHIP_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      origin_postal_code: Number(input.originPostalCode ?? process.env.SHIPPING_ORIGIN_POSTAL_CODE ?? 12940),
      destination_postal_code: Number(input.destinationPostalCode),
      couriers: "jne,jnt,sicepat,anteraja",
      items: [
        {
          name: "Zimeira Hijab",
          description: "Produk hijab",
          value: 100000,
          length: 20,
          width: 15,
          height: 5,
          weight: input.weightGram,
          quantity: 1,
        },
      ],
    }),
  });

  if (!response.ok) return [];

  const payload = (await response.json()) as {
    pricing?: Array<{
      courier_code?: string;
      courier_name?: string;
      courier_service_code?: string;
      courier_service_name?: string;
      description?: string;
      duration?: string;
      price?: number;
    }>;
  };

  return (payload.pricing ?? []).map((rate) => ({
    id: `biteship-${rate.courier_code}-${rate.courier_service_code}`,
    provider: rate.courier_name ?? rate.courier_code ?? "Biteship",
    service: rate.courier_service_code ?? rate.courier_service_name ?? "Regular",
    label: `${rate.courier_name ?? rate.courier_code} ${rate.courier_service_code ?? ""}`.trim(),
    description: rate.description ?? rate.courier_service_name ?? "Layanan pengiriman",
    etd: rate.duration ?? "-",
    cost: rate.price ?? 0,
  }));
}
