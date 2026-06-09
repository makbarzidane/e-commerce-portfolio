"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, CreditCard, Loader2, MapPin, PackageCheck, Trash2, Truck } from "lucide-react";
import { createCheckoutOrder } from "@/app/(shop)/checkout/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import type { CartLine } from "@/lib/cart";
import { formatCurrency } from "@/lib/format";
import type { PaymentMethod } from "@/lib/integrations/payment";
import type { ShippingRate } from "@/lib/integrations/shipping";
import { cn } from "@/lib/utils";

type CheckoutFormProps = {
  cartItems: CartLine[];
  errorMessage?: string | null;
  customerDefaults: {
    name: string;
    email: string;
    phone: string;
    recipient: string;
    province: string;
    city: string;
    district: string;
    postalCode: string;
    addressLine: string;
  };
  paymentMethods: PaymentMethod[];
  coupons: CheckoutCoupon[];
  shippingRates: ShippingRate[];
};

type CheckoutCoupon = {
  code: string;
  description: string | null;
  discountPercent: number | null;
  discountAmount: number | null;
  minPurchase: number;
  startsAt: string | null;
  endsAt: string | null;
};

export function CheckoutForm({ cartItems, errorMessage, customerDefaults, paymentMethods, coupons, shippingRates }: CheckoutFormProps) {
  const [localCartItems, setLocalCartItems] = useState(cartItems);
  const [syncingIds, setSyncingIds] = useState<string[]>([]);
  const [availableShippingRates, setAvailableShippingRates] = useState(shippingRates);
  const [selectedShippingId, setSelectedShippingId] = useState(shippingRates[0]?.id ?? "");
  const [selectedPaymentId, setSelectedPaymentId] = useState(paymentMethods[0]?.id ?? "");
  const [couponCode, setCouponCode] = useState("");
  const [postalCode, setPostalCode] = useState(customerDefaults.postalCode);
  const [city, setCity] = useState(customerDefaults.city);
  const [province, setProvince] = useState(customerDefaults.province);
  const [district, setDistrict] = useState(customerDefaults.district);
  const [isCheckingShipping, setIsCheckingShipping] = useState(false);
  const [shippingMessage, setShippingMessage] = useState<string | null>(null);
  const subtotal = useMemo(() => localCartItems.reduce((total, item) => total + item.price * item.quantity, 0), [localCartItems]);
  const shipmentWeight = Math.max(500, localCartItems.reduce((total, item) => total + item.quantity * 250, 0));
  const selectedShipping = availableShippingRates.find((rate) => rate.id === selectedShippingId) ?? availableShippingRates[0];
  const selectedPayment = paymentMethods.find((method) => method.id === selectedPaymentId) ?? paymentMethods[0];
  const coupon = findCoupon(coupons, couponCode, subtotal);
  const discountTotal = coupon ? calculateDiscount(coupon, subtotal) : 0;
  const shippingCost = selectedShipping?.cost ?? 0;
  const grandTotal = Math.max(0, subtotal - discountTotal) + shippingCost;
  const isEmpty = localCartItems.length === 0;
  const hasStockIssue = localCartItems.some((item) => !item.variant.id || !item.variant.isActive || item.quantity > item.variant.stock);
  const isCartSyncing = syncingIds.length > 0;

  async function syncCartItem(id: string, quantity: number) {
    setSyncingIds((current) => Array.from(new Set([...current, id])));
    try {
      await fetch("/api/cart/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, quantity }),
      });
    } finally {
      setSyncingIds((current) => current.filter((itemId) => itemId !== id));
    }
  }

  function updateLocalQuantity(id: string, quantity: number, stock: number) {
    const safeQuantity = Math.min(Math.max(0, quantity), stock);
    const existing = localCartItems.find((item) => item.id === id);
    if (existing) {
      window.dispatchEvent(new CustomEvent("zimeira:cart-count", { detail: { delta: safeQuantity - existing.quantity } }));
    }

    setLocalCartItems((current) => {
      if (safeQuantity < 1) return current.filter((item) => item.id !== id);
      return current.map((item) => (item.id === id ? { ...item, quantity: safeQuantity } : item));
    });
    void syncCartItem(id, safeQuantity);
  }

  async function removeLocalItem(id: string) {
    const existing = localCartItems.find((item) => item.id === id);
    if (existing) {
      window.dispatchEvent(new CustomEvent("zimeira:cart-count", { detail: { delta: -existing.quantity } }));
    }

    setLocalCartItems((current) => current.filter((item) => item.id !== id));
    setSyncingIds((current) => Array.from(new Set([...current, id])));
    try {
      await fetch("/api/cart/items", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } finally {
      setSyncingIds((current) => current.filter((itemId) => itemId !== id));
    }
  }

  async function checkShippingRates() {
    setIsCheckingShipping(true);
    setShippingMessage(null);

    try {
      const response = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationPostalCode: postalCode,
          destinationCity: city,
          weightGram: shipmentWeight,
        }),
      });
      const payload = (await response.json()) as { rates?: ShippingRate[]; error?: string };

      if (!response.ok || !payload.rates?.length) {
        setShippingMessage(payload.error ?? "Ongkir belum tersedia untuk alamat ini. Opsi demo tetap bisa digunakan.");
        return;
      }

      setAvailableShippingRates(payload.rates);
      setSelectedShippingId(payload.rates[0].id);
      setShippingMessage("Ongkir berhasil diperbarui.");
    } catch {
      setShippingMessage("Gagal cek ongkir. Periksa koneksi atau API key pengiriman.");
    } finally {
      setIsCheckingShipping(false);
    }
  }

  return (
    <form action={createCheckoutOrder} className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_410px] lg:px-8">
      <div className="flex flex-col gap-5">
        <div className="animate-fade-up">
          <Link href="/keranjang" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground">
            <ArrowLeft data-icon="inline-start" />
            Kembali ke Keranjang
          </Link>
          <Badge variant="secondary" className="mb-3">Secure checkout</Badge>
          <h1 className="text-4xl font-semibold tracking-tight">Checkout</h1>
          <p className="mt-2 text-muted-foreground">Lengkapi alamat, pilih jasa kirim, dan metode pembayaran.</p>
        </div>
        {errorMessage ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}
        {isEmpty ? (
          <div className="rounded-2xl border border-primary/25 bg-primary/10 p-4 text-sm text-primary">
            Minimal harus memesan 1 produk untuk melanjutkan checkout. Silakan kembali ke katalog atau keranjang untuk menambahkan produk.
          </div>
        ) : null}

        <CheckoutStep number="1" icon={MapPin} title="Alamat Pengiriman" description="Alamat akan disimpan ke riwayat pesanan.">
          <div className="mb-4 rounded-2xl border bg-muted/35 p-4 text-sm text-muted-foreground">
            Pastikan nama penerima, nomor HP, dan kode pos sesuai alamat paket. Ongkir real membutuhkan kode pos tujuan yang valid.
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama penerima"><Input name="customerName" defaultValue={customerDefaults.recipient} placeholder="Nama penerima paket" required /></Field>
            <Field label="Email"><Input name="customerEmail" type="email" defaultValue={customerDefaults.email} required /></Field>
            <Field label="Nomor HP"><Input name="customerPhone" defaultValue={customerDefaults.phone} placeholder="081234567890" pattern="^[0-9+ ]{9,16}$" required /></Field>
            <Field label="Provinsi">
              <Input
                name="province"
                value={province}
                onChange={(event) => setProvince(event.target.value)}
                placeholder="Nama provinsi"
                required
              />
            </Field>
            <Field label="Kota/Kabupaten">
              <Input
                name="city"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Nama kota/kabupaten"
                required
              />
            </Field>
            <Field label="Kecamatan">
              <Input
                name="district"
                value={district}
                onChange={(event) => setDistrict(event.target.value)}
                placeholder="Nama kecamatan"
                required
              />
            </Field>
            <Field label="Kode pos"><Input name="postalCode" value={postalCode} onChange={(event) => setPostalCode(event.target.value)} placeholder="Kode pos" pattern="^[0-9]{5}$" required /></Field>
            <div className="sm:col-span-2">
              <Field label="Alamat lengkap"><Textarea name="addressLine" defaultValue={customerDefaults.addressLine} placeholder="Nama jalan, nomor rumah, patokan" required /></Field>
            </div>
          </div>
        </CheckoutStep>

        <CheckoutStep number="2" icon={Truck} title="Jasa Kirim" description="Opsi demo aktif. RajaOngkir/Biteship siap disambungkan via API key.">
          <div className="mb-4 flex flex-col gap-3 rounded-2xl border bg-background/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Cek ongkir berdasarkan kode pos</p>
              <p className="text-sm text-muted-foreground">Berat estimasi paket: {shipmentWeight} gram dari {localCartItems.reduce((total, item) => total + item.quantity, 0)} item.</p>
              {shippingMessage ? <p className="mt-1 text-sm text-muted-foreground">{shippingMessage}</p> : null}
            </div>
            <button type="button" onClick={checkShippingRates} disabled={isCheckingShipping || postalCode.length < 5} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium transition hover:bg-muted disabled:opacity-50">
              {isCheckingShipping ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
              Cek Ongkir
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {availableShippingRates.map((rate) => {
              const isSelected = selectedShippingId === rate.id;

              return (
                <label
                  key={rate.id}
                  className={cn(
                    "motion-card cursor-pointer rounded-2xl border bg-background/80 p-4 transition",
                    isSelected && "border-primary bg-secondary/70 shadow-sm"
                  )}
                >
                  <input
                    type="radio"
                    name="shippingRateId"
                    value={rate.id}
                    checked={isSelected}
                    onChange={() => setSelectedShippingId(rate.id)}
                    className="sr-only"
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{rate.label}</p>
                      <p className="mt-1 text-xs font-medium text-primary">{rate.provider} - {rate.service}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{rate.description}</p>
                    </div>
                    <Badge variant="outline">{rate.etd}</Badge>
                  </div>
                  <p className="mt-4 text-lg font-semibold">{formatCurrency(rate.cost)}</p>
                </label>
              );
            })}
          </div>
        </CheckoutStep>

        <CheckoutStep number="3" icon={CreditCard} title="Pembayaran" description="Manual transfer langsung aktif. Midtrans aktif setelah key production diisi.">
          <div className="grid gap-3 md:grid-cols-2">
            {paymentMethods.map((method) => {
              const isSelected = selectedPaymentId === method.id;

              return (
                <label
                  key={method.id}
                  className={cn(
                    "motion-card cursor-pointer rounded-2xl border bg-background/80 p-4 transition",
                    isSelected && "border-primary bg-secondary/70 shadow-sm"
                  )}
                >
                  <input
                    type="radio"
                    name="paymentMethodId"
                    value={method.id}
                    checked={isSelected}
                    onChange={() => setSelectedPaymentId(method.id)}
                    className="sr-only"
                  />
                  <p className="font-semibold">{method.label}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{method.description}</p>
                </label>
              );
            })}
          </div>
        </CheckoutStep>
      </div>

      <Card className="silk-panel h-fit rounded-2xl shadow-sm lg:sticky lg:top-24">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PackageCheck className="size-4" /> Ringkasan Order</CardTitle>
          <CardDescription>{localCartItems.length} item di keranjang</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            {localCartItems.map((item) => (
              <div key={item.id} className="grid grid-cols-[56px_1fr] gap-3 rounded-xl border bg-background/70 p-2">
                <Image src={item.product.image} alt={item.product.name} width={80} height={100} className="aspect-[4/5] rounded-lg object-cover" />
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">{item.quantity} x {item.variant.color}</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                  {item.quantity > item.variant.stock || !item.variant.isActive ? (
                    <p className="text-xs text-destructive">Stok tidak mencukupi</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max={item.variant.stock}
                      value={item.quantity}
                      onChange={(event) => updateLocalQuantity(item.id, Number.parseInt(event.target.value || "0", 10), item.variant.stock)}
                      className="h-8 w-20"
                    />
                    {syncingIds.includes(item.id) ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
                    <Button type="button" size="icon-sm" variant="ghost" aria-label="Hapus item" onClick={() => void removeLocalItem(item.id)}>
                      <Trash2 data-icon="only" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border bg-background/70 p-3">
            <Label htmlFor="couponCode" className="text-sm">Voucher</Label>
            <Input
              id="couponCode"
              name="couponCode"
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
              placeholder="Masukkan kode voucher"
              className="mt-2"
            />
            {couponCode ? (
              coupon ? (
                <p className="mt-2 text-xs text-muted-foreground">{coupon.description ?? "Voucher berhasil diterapkan."}</p>
              ) : (
                <p className="mt-2 text-xs text-destructive">Voucher tidak valid atau minimum belanja belum terpenuhi.</p>
              )
            ) : null}
          </div>
          <div className="flex flex-col gap-2 rounded-xl bg-background/70 p-3 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between"><span>Diskon</span><span>-{formatCurrency(discountTotal)}</span></div>
            <div className="flex justify-between"><span>{selectedShipping?.label ?? "Ongkir"}</span><span>{formatCurrency(shippingCost)}</span></div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{selectedShipping?.provider ?? "Jasa kirim"}</span>
              <span>{selectedShipping?.etd ?? "-"}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-foreground"><span>Total</span><span>{formatCurrency(grandTotal)}</span></div>
          </div>
          {selectedPayment ? (
            <div className="rounded-xl border bg-background/70 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">{selectedPayment.label}</p>
              <p className="mt-1">{selectedPayment.instructions}</p>
            </div>
          ) : null}
          <SubmitButton type="submit" size="lg" className="w-full" disabled={isEmpty || hasStockIssue || isCartSyncing} pendingLabel="Membuat pesanan...">
            Buat Pesanan
          </SubmitButton>
          {isEmpty ? <p className="text-center text-xs text-muted-foreground">Minimal harus memesan 1 produk untuk melanjutkan pembelian.</p> : null}
          {hasStockIssue ? <p className="text-center text-xs text-destructive">Ada item dengan stok tidak cukup. Update keranjang terlebih dahulu.</p> : null}
          {isCartSyncing ? <p className="text-center text-xs text-muted-foreground">Menyimpan perubahan keranjang...</p> : null}
        </CardContent>
      </Card>
    </form>
  );
}

function findCoupon(coupons: CheckoutCoupon[], code: string, subtotal: number) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  const now = Date.now();
  return coupons.find((coupon) => {
    if (coupon.code.toUpperCase() !== normalized) return false;
    if (coupon.minPurchase > subtotal) return false;
    if (coupon.startsAt && new Date(coupon.startsAt).getTime() > now) return false;
    if (coupon.endsAt && new Date(coupon.endsAt).getTime() < now) return false;
    return Boolean(coupon.discountPercent || coupon.discountAmount);
  }) ?? null;
}

function calculateDiscount(coupon: CheckoutCoupon, subtotal: number) {
  if (coupon.discountPercent) {
    return Math.min(subtotal, Math.floor((subtotal * coupon.discountPercent) / 100));
  }

  return Math.min(subtotal, coupon.discountAmount ?? 0);
}

function CheckoutStep({
  number,
  icon: Icon,
  title,
  description,
  children,
}: {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl bg-card/90 shadow-sm">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">{number}</span>
          <div>
            <CardTitle className="flex items-center gap-2"><Icon className="size-4" /> {title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
