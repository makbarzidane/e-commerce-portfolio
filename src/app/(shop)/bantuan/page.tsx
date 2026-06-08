import Link from "next/link";
import { CreditCard, HelpCircle, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const helpSections = [
  {
    icon: CreditCard,
    title: "Pembayaran",
    items: [
      "Setelah checkout, halaman pembayaran dapat dibuka ulang dari Akun > Pesanan Saya.",
      "Order yang belum dibayar akan menampilkan tombol Bayar Sekarang.",
      "Jika Midtrans aktif, tombol pembayaran akan membuka halaman Snap Midtrans.",
      "Jika manual transfer aktif, gunakan instruksi rekening dan nomor order pada berita transfer.",
    ],
  },
  {
    icon: Truck,
    title: "Pengiriman",
    items: [
      "Ongkir dihitung berdasarkan kode pos dan berat paket.",
      "Nomor resi akan muncul setelah admin menginput data pengiriman.",
      "Status lacak paket mengikuti update order dari toko dan siap disambungkan ke provider tracking.",
    ],
  },
  {
    icon: RotateCcw,
    title: "Retur / Refund",
    items: [
      "Retur dapat diajukan dari detail pesanan setelah pesanan selesai diterima.",
      "Admin akan approve/reject pengajuan retur.",
      "Refund diproses setelah barang diterima dan nominal refund dikonfirmasi admin.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Akun dan Keamanan",
    items: [
      "Customer production disarankan login/register dengan Google verified.",
      "Checkout mewajibkan nomor HP terverifikasi.",
      "Reset password manual memakai kode email 6 digit yang berlaku 15 menit.",
    ],
  },
];

export default function HelpPage() {
  return (
    <section className="brand-surface min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <Badge variant="secondary" className="gap-1">
            <HelpCircle className="size-3" />
            Bantuan
          </Badge>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Pusat Bantuan Zimeira</h1>
          <p className="mt-3 text-muted-foreground">
            Panduan singkat untuk pembayaran, pengiriman, retur, dan keamanan akun customer.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {helpSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.title} className="rounded-2xl bg-card/95 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="size-4 text-primary" />
                    {section.title}
                  </CardTitle>
                  <CardDescription>Poin penting yang perlu diketahui customer.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="grid gap-3 text-sm text-muted-foreground">
                    {section.items.map((item) => (
                      <li key={item} className="rounded-xl border bg-background/70 p-3">
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border bg-background/70 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">Butuh cek pesanan?</p>
            <p className="text-sm text-muted-foreground">Buka Pesanan Saya untuk lanjut bayar, cek status, atau cetak invoice.</p>
          </div>
          <Link href="/lacak" className={buttonVariants()}>
            Buka Pesanan Saya
          </Link>
        </div>
      </div>
    </section>
  );
}
