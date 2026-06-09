"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function HeaderCartLink({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    function handleCartCount(event: Event) {
      const detail = (event as CustomEvent<{ delta?: number; count?: number }>).detail;
      setCount((current) => Math.max(0, typeof detail?.count === "number" ? detail.count : current + (detail?.delta ?? 0)));
    }

    window.addEventListener("zimeira:cart-count", handleCartCount);
    return () => window.removeEventListener("zimeira:cart-count", handleCartCount);
  }, []);

  return (
    <Link href="/keranjang" className={buttonVariants({ className: "relative h-9 px-2.5 sm:px-4" })} aria-label="Keranjang">
      <ShoppingBag data-icon="inline-start" />
      <span className="hidden sm:inline">Keranjang</span>
      {count > 0 ? <Counter value={count} /> : null}
    </Link>
  );
}

export function HeaderWishlistLink({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    function handleWishlistCount(event: Event) {
      const detail = (event as CustomEvent<{ delta?: number; count?: number }>).detail;
      setCount((current) => Math.max(0, typeof detail?.count === "number" ? detail.count : current + (detail?.delta ?? 0)));
    }

    window.addEventListener("zimeira:wishlist-count", handleWishlistCount);
    return () => window.removeEventListener("zimeira:wishlist-count", handleWishlistCount);
  }, []);

  return (
    <Link href="/wishlist" className={buttonVariants({ variant: "ghost", size: "icon", className: "relative" })} aria-label="Wishlist">
      <Heart data-icon="only" />
      {count > 0 ? <Counter value={count} /> : null}
    </Link>
  );
}

function Counter({ value }: { value: number }) {
  return (
    <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-semibold text-accent-foreground shadow-sm">
      {value > 99 ? "99+" : value}
    </span>
  );
}
