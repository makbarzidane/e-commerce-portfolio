"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastState = {
  id: number;
  tone: "success" | "error" | "info";
  message: string;
};

const queryMessages: Record<string, ToastState["tone"] | undefined> = {
  "cart:added": "success",
  "created:1": "success",
  "registered:1": "success",
  "error:stock": "error",
  "error:coupon": "error",
  "error:address": "error",
  "error:database": "error",
  "error:rate-limit": "error",
};

const messageText: Record<string, string> = {
  "cart:added": "Produk berhasil masuk keranjang.",
  "created:1": "Pesanan berhasil dibuat.",
  "registered:1": "Registrasi berhasil. Silakan login.",
  "error:stock": "Stok tidak mencukupi. Periksa keranjang atau varian.",
  "error:coupon": "Voucher tidak valid atau tidak memenuhi syarat.",
  "error:address": "Alamat belum lengkap atau format belum valid.",
  "error:database": "Aksi belum berhasil. Coba lagi sebentar.",
  "error:rate-limit": "Terlalu banyak percobaan. Coba lagi beberapa menit.",
};

export function ToastCenter() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [toast, setToast] = useState<ToastState | null>(null);
  const lastToastRef = useRef<{ key: string; shownAt: number } | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const showToast = useCallback((nextToast: Omit<ToastState, "id">) => {
    const key = `${nextToast.tone}:${nextToast.message}`;
    const now = Date.now();
    const lastToast = lastToastRef.current;

    if (lastToast?.key === key && now - lastToast.shownAt < 1500) return;

    lastToastRef.current = { key, shownAt: now };
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
    }
    setToast({ ...nextToast, id: now });
    hideTimerRef.current = window.setTimeout(() => {
      setToast(null);
      hideTimerRef.current = null;
    }, 3200);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function handleToast(event: Event) {
      const customEvent = event as CustomEvent<Omit<ToastState, "id">>;
      if (!customEvent.detail?.message) return;

      showToast(customEvent.detail);
    }

    window.addEventListener("zimeira:toast", handleToast);
    return () => window.removeEventListener("zimeira:toast", handleToast);
  }, [showToast]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const fromCookie = readCookieToast();
      if (!fromCookie) return;

      showToast(fromCookie);
    }, 800);

    return () => window.clearInterval(timer);
  }, [showToast]);

  useEffect(() => {
    const fromQuery = readQueryToast(searchParams, pathname);
    const fromCookie = readCookieToast();
    const nextToast = fromCookie ?? fromQuery;

    if (!nextToast) return;

    const showTimer = window.setTimeout(() => showToast(nextToast), 0);
    return () => window.clearTimeout(showTimer);
  }, [pathname, searchParams, showToast]);

  if (!toast) return null;

  const Icon = toast.tone === "success" ? CheckCircle2 : toast.tone === "error" ? XCircle : Info;

  return (
    <div className="fixed right-4 top-20 z-50 max-w-sm">
      <div
        className={cn(
          "flex items-start gap-3 rounded-2xl border bg-background px-4 py-3 text-sm shadow-xl shadow-primary/10",
          toast.tone === "success" && "border-primary/25",
          toast.tone === "error" && "border-destructive/30",
        )}
      >
        <Icon data-icon="inline-start" className={toast.tone === "error" ? "text-destructive" : "text-primary"} />
        <p className="font-medium">{toast.message}</p>
      </div>
    </div>
  );
}

function readQueryToast(searchParams: URLSearchParams, pathname: string): Omit<ToastState, "id"> | null {
  for (const [key, value] of searchParams.entries()) {
    const lookup = `${key}:${value}`;
    const tone = queryMessages[lookup];
    if (!tone) continue;
    if (!isToastAllowedOnPath(lookup, pathname)) continue;

    return { tone, message: messageText[lookup] };
  }

  return null;
}

function isToastAllowedOnPath(lookup: string, pathname: string) {
  if (lookup.startsWith("error:")) {
    return pathname.startsWith("/checkout") || pathname.startsWith("/keranjang") || pathname.startsWith("/produk") || pathname.startsWith("/auth");
  }
  if (lookup.startsWith("cart:")) return pathname.startsWith("/produk") || pathname.startsWith("/keranjang");
  if (lookup === "created:1") return pathname.startsWith("/pesanan") || pathname.startsWith("/checkout");
  if (lookup === "registered:1") return pathname.startsWith("/auth");
  return true;
}

function readCookieToast(): Omit<ToastState, "id"> | null {
  const raw = document.cookie
    .split("; ")
    .find((item) => item.startsWith("zimeira_toast="))
    ?.split("=")[1];

  if (!raw) return null;

  document.cookie = "zimeira_toast=; path=/; max-age=0";

  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Omit<ToastState, "id">;
    if (!parsed.message || !parsed.tone) return null;
    return parsed;
  } catch {
    return null;
  }
}
