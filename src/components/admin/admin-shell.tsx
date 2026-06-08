import Link from "next/link";
import { BarChart3, Boxes, FileDown, History, ImageIcon, LayoutDashboard, PackageSearch, RotateCcw, Settings, ShoppingCart, Tags, Ticket, UsersRound } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/produk", label: "Produk", icon: Boxes },
  { href: "/admin/kategori", label: "Kategori", icon: Tags },
  { href: "/admin/varian", label: "Varian Produk", icon: BarChart3 },
  { href: "/admin/inventory", label: "Inventory", icon: PackageSearch },
  { href: "/admin/audit", label: "Audit Log", icon: History },
  { href: "/admin/pesanan", label: "Pesanan", icon: ShoppingCart },
  { href: "/admin/retur", label: "Retur & Refund", icon: RotateCcw },
  { href: "/admin/laporan", label: "Laporan", icon: FileDown },
  { href: "/admin/customer", label: "Customer", icon: UsersRound },
  { href: "/admin/voucher", label: "Voucher", icon: Ticket },
  { href: "/admin/banner", label: "Banner Promo", icon: ImageIcon },
  { href: "/admin/pengaturan", label: "Pengaturan", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/35">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r bg-background/92 p-5 shadow-xl shadow-primary/5 backdrop-blur lg:block">
        <Link href="/admin" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20">
            ZI
          </span>
          <span className="font-semibold">Zimeira Admin</span>
        </Link>
        <nav className="mt-8 flex flex-col gap-1">
          {adminNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary/80 hover:text-foreground hover:shadow-sm"
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="lg:pl-72">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <div className="silk-panel flex items-center justify-between rounded-2xl border bg-background px-4 py-3 shadow-sm">
            <div>
              <p className="text-sm text-muted-foreground">Admin Panel</p>
              <p className="font-semibold">Zimeira Hijab Store</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Lihat toko
              </Link>
              <LogoutButton callbackUrl="/admin/login" />
            </div>
          </div>
          <nav className="grid gap-2 sm:grid-cols-2 lg:hidden">
            {adminNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl border bg-background px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary/80 hover:text-foreground"
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          {children}
        </div>
      </main>
    </div>
  );
}
