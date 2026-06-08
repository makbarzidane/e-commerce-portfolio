import Link from "next/link";
import { storeSettings } from "@/lib/data";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/35">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div className="flex flex-col gap-3">
          <p className="text-lg font-semibold">{storeSettings.name}</p>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            Fictional hijab ecommerce brand from Pagar Alam, founded in 2026, with catalog, checkout, and admin CMS foundations.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <p className="font-medium">Customer</p>
          <Link href="/produk" className="text-muted-foreground hover:text-foreground">Katalog Produk</Link>
          <Link href="/pesanan" className="text-muted-foreground hover:text-foreground">Riwayat Pesanan</Link>
          <Link href="/bantuan" className="text-muted-foreground hover:text-foreground">Bantuan</Link>
          <Link href="/auth/login" className="text-muted-foreground hover:text-foreground">Login/Register</Link>
        </div>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Kontak</p>
          <span>{storeSettings.email}</span>
          <span>{storeSettings.phone}</span>
          <span>{storeSettings.address}</span>
        </div>
      </div>
    </footer>
  );
}
