import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { authOptions } from "@/lib/auth";
import { getCartLines } from "@/lib/cart";
import { demoCoupons } from "@/lib/demo-coupons";
import { getShippingRates } from "@/lib/integrations/shipping";
import { paymentMethods } from "@/lib/integrations/payment";
import { getPrisma } from "@/lib/prisma";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/keranjang?auth=required");
  }

  const isPortfolioDemo = !process.env.DATABASE_URL;
  const customer = isPortfolioDemo
    ? { phone: "+6281234567890", phoneVerifiedAt: new Date() }
    : await getPrisma().user.findUnique({
        where: { id: session.user.id },
        select: { phone: true, phoneVerifiedAt: true },
      });

  if (!customer?.phone || !customer.phoneVerifiedAt) {
    redirect("/akun?verifyPhone=required");
  }

  const cartItems = await getCartLines();
  const coupons = isPortfolioDemo
    ? demoCoupons
    : await getPrisma().coupon.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        select: {
          code: true,
          description: true,
          discountPercent: true,
          discountAmount: true,
          minPurchase: true,
          startsAt: true,
          endsAt: true,
        },
      });
  const shippingRates = await getShippingRates({
    originCity: "Pagar Alam",
    destinationCity: "Pagar Alam",
    weightGram: Math.max(500, cartItems.reduce((total, item) => total + item.quantity * 250, 0)),
  });
  const params = await searchParams;
  const errorMessage = getCheckoutErrorMessage(params.error);

  return (
    <section className="brand-surface min-h-screen">
      <CheckoutForm
        cartItems={cartItems}
        errorMessage={errorMessage}
        customerDefaults={{
          name: session.user.name ?? "",
          email: session.user.email ?? "",
          phone: customer.phone,
          recipient: "",
          province: "",
          city: "",
          district: "",
          postalCode: "",
          addressLine: "",
        }}
        paymentMethods={paymentMethods}
        coupons={coupons.map((coupon) => ({
          ...coupon,
          startsAt: coupon.startsAt instanceof Date ? coupon.startsAt.toISOString() : coupon.startsAt,
          endsAt: coupon.endsAt instanceof Date ? coupon.endsAt.toISOString() : coupon.endsAt,
        }))}
        shippingRates={shippingRates}
      />
    </section>
  );
}

function getCheckoutErrorMessage(error?: string) {
  if (error === "stock") return "Beberapa item memiliki stok tidak cukup. Silakan update keranjang sebelum checkout.";
  if (error === "coupon") return "Voucher tidak valid, sudah habis, atau minimum belanja belum terpenuhi.";
  if (error === "address") return "Alamat belum lengkap atau format nomor HP/kode pos belum valid.";
  if (error === "phone") return "Nomor HP checkout harus sama dengan nomor yang sudah diverifikasi di akun.";
  if (error === "rate-limit") return "Terlalu banyak percobaan checkout. Coba lagi beberapa menit.";
  if (error === "database") return "Pesanan belum bisa dibuat. Coba lagi beberapa saat lagi.";
  return null;
}
