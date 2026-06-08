import Link from "next/link";
import { getServerSession } from "next-auth";
import { Heart, ShoppingBag, UserRound } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
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
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20">
            ZI
          </span>
          <span className="font-semibold tracking-wide">Zimeira Hijab Store</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="relative transition-colors hover:text-foreground after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-accent after:transition-all hover:after:w-full">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <Link href="/wishlist" className={buttonVariants({ variant: "ghost", size: "icon", className: "relative" })} aria-label="Wishlist">
                <Heart data-icon="only" />
                {wishlistCount > 0 ? <Counter value={wishlistCount} /> : null}
              </Link>
              <Link href="/akun" aria-label="Akun saya" className={buttonVariants({ variant: "ghost", size: "icon" })}>
                <UserRound data-icon="only" />
              </Link>
              <LogoutButton compact />
            </>
          ) : (
            <Link href="/auth/login" className={buttonVariants({ variant: "outline", className: "px-3 text-xs sm:px-4 sm:text-sm" })}>
              Login / Register
            </Link>
          )}
          <Link href="/keranjang" className={buttonVariants({ className: "relative" })}>
            <ShoppingBag data-icon="inline-start" />
            Keranjang
            {cartCount > 0 ? <Counter value={cartCount} /> : null}
          </Link>
        </div>
      </div>
    </header>
  );
}

function Counter({ value }: { value: number }) {
  return (
    <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-semibold text-accent-foreground shadow-sm">
      {value > 99 ? "99+" : value}
    </span>
  );
}
