import Link from "next/link";
import { getServerSession } from "next-auth";
import { UserRound } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { HeaderCartLink, HeaderWishlistLink } from "@/components/layout/header-actions";
import { authOptions } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { getCartLines } from "@/lib/cart";
import { getPrisma } from "@/lib/prisma";

const navItems = [
  { href: "/", label: "Beranda" },
  { href: "/produk", label: "Katalog" },
  { href: "/tentang", label: "Tentang" },
  { href: "/kontak", label: "Kontak" },
];

export async function SiteHeader() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = Boolean(session?.user);
  const [cartCount, wishlistCount] = await Promise.all([
    getCartLines().then((items) => items.reduce((total, item) => total + item.quantity, 0)).catch(() => 0),
    isLoggedIn ? getPrisma().wishlist.count({ where: { userId: session?.user?.id } }).catch(() => 0) : Promise.resolve(0),
  ]);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/82 shadow-sm shadow-primary/5 backdrop-blur-xl">
      <div className="mx-auto flex min-h-14 w-full max-w-7xl items-center justify-between gap-3 px-3 py-2 sm:h-16 sm:px-6 sm:py-0 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 sm:size-10">
            ZI
          </span>
          <span className="truncate text-sm font-semibold tracking-wide sm:text-base">Zimeira Hijab Store</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="relative transition-colors hover:text-foreground after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-accent after:transition-all hover:after:w-full">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {isLoggedIn ? (
            <>
              <HeaderWishlistLink initialCount={wishlistCount} />
              <Link href="/akun" aria-label="Akun saya" className={buttonVariants({ variant: "ghost", size: "icon" })}>
                <UserRound data-icon="only" />
              </Link>
              <LogoutButton compact />
            </>
          ) : (
            <Link href="/auth/login" className={buttonVariants({ variant: "outline", className: "h-9 px-2.5 text-xs sm:px-4 sm:text-sm" })}>
              <span className="sm:hidden">Login</span>
              <span className="hidden sm:inline">Login / Register</span>
            </Link>
          )}
          <HeaderCartLink initialCount={cartCount} />
        </div>
      </div>
      <nav className="mx-auto flex w-full max-w-7xl gap-2 overflow-x-auto px-3 pb-2 text-xs font-medium text-muted-foreground md:hidden">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="shrink-0 rounded-full border bg-background/70 px-3 py-1.5 transition hover:border-primary hover:text-foreground">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
