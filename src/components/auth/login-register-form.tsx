"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { registerCustomer } from "@/app/(shop)/auth/actions";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function LoginRegisterForm({ googleAuthEnabled, portfolioDemoMode = false }: { googleAuthEnabled: boolean; portfolioDemoMode?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  async function handleLogin(formData: FormData) {
    setMessage(null);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    startTransition(async () => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
        return;
      }

      setMessage("Email atau password tidak cocok.");
    });
  }

  function handleGoogleLogin() {
    void signIn("google", { callbackUrl });
  }

  function handleDemoCustomerLogin() {
    setMessage(null);
    startTransition(async () => {
      const result = await signIn("credentials", {
        email: "customer@zimeirahijab.test",
        password: "password123",
        redirect: false,
      });

      if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
        return;
      }

      setMessage("Mode demo customer belum tersedia.");
    });
  }

  const registered = searchParams.get("registered") === "1";
  const resetSuccess = searchParams.get("reset") === "success";
  const error = searchParams.get("error");
  const defaultTab = searchParams.get("mode") === "register" ? "register" : "login";

  if (googleAuthEnabled) {
    return (
      <CardContent className="flex flex-col gap-5">
        <div className="rounded-2xl border bg-secondary/35 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Login customer wajib memakai Google.</p>
          <p className="mt-1">Email Google harus verified agar akun lebih legit untuk checkout, wishlist, dan Pesanan Saya.</p>
        </div>
        <Button type="button" className="w-full" onClick={handleGoogleLogin}>
          Masuk / Register dengan Google
        </Button>
        <p className="text-xs text-muted-foreground">
          Login email/password manual hanya aktif ketika env Google belum diisi. Admin tetap memakai halaman login admin terpisah.
        </p>
      </CardContent>
    );
  }

  return (
    <CardContent className="flex flex-col gap-5">
      <div className="rounded-2xl border bg-secondary/35 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Belanja perlu akun customer.</p>
        <p className="mt-1">Mode manual aktif karena Google auth belum diisi. Untuk production, aktifkan Google login.</p>
      </div>
      <Tabs defaultValue={defaultTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="register">Sign up</TabsTrigger>
        </TabsList>
        <TabsContent value="login" className="mt-5">
          <form action={handleLogin} className="grid gap-4">
            {registered ? <Notice>Registrasi berhasil. Silakan login.</Notice> : null}
            {resetSuccess ? <Notice>Password berhasil diganti. Silakan login.</Notice> : null}
            {message ? <Notice tone="error">{message}</Notice> : null}
            <Field label="Email">
              <Input name="email" type="email" placeholder="email@example.com" required />
            </Field>
            <Field label="Password">
              <Input name="password" type="password" placeholder="Masukkan password" required />
            </Field>
            <Button type="submit" disabled={isPending}>{isPending ? "Memproses..." : "Masuk"}</Button>
          </form>
          <Link href="/auth/reset-password" className="mt-3 inline-flex text-sm font-medium text-primary hover:underline">
            Lupa password?
          </Link>
          {portfolioDemoMode ? (
            <Button type="button" variant="outline" className="mt-4 w-full" disabled={isPending} onClick={handleDemoCustomerLogin}>
              Masuk sebagai Customer Demo
            </Button>
          ) : null}
        </TabsContent>
        <TabsContent value="register" className="mt-5">
          <form action={registerCustomer} className="grid gap-4">
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            {error === "email-exists" ? <Notice tone="error">Email sudah terdaftar.</Notice> : null}
            {error === "register-validation" ? <Notice tone="error">Nama, email, dan password minimal 8 karakter wajib diisi.</Notice> : null}
            {error === "email-real-required" ? <Notice tone="error">Gunakan email aktif asli. Email demo, domain testing, atau disposable tidak bisa dipakai.</Notice> : null}
            {error === "rate-limit" ? <Notice tone="error">Terlalu banyak percobaan register. Coba lagi beberapa menit lagi.</Notice> : null}
            <Field label="Nama">
              <Input name="name" placeholder="Nama lengkap" required />
            </Field>
            <Field label="Email">
              <Input name="email" type="email" placeholder="email@example.com" required />
            </Field>
            <Field label="Password">
              <Input name="password" type="password" placeholder="Minimal 8 karakter" minLength={8} required />
            </Field>
            <SubmitButton type="submit" pendingLabel="Membuat akun...">Buat Akun</SubmitButton>
          </form>
        </TabsContent>
      </Tabs>
    </CardContent>
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

function Notice({ children, tone = "success" }: { children: React.ReactNode; tone?: "success" | "error" }) {
  return (
    <p
      className={
        tone === "error"
          ? "rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          : "rounded-md bg-secondary px-3 py-2 text-sm text-secondary-foreground"
      }
    >
      {children}
    </p>
  );
}
