"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminLoginForm({ portfolioDemoMode = false }: { portfolioDemoMode?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

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
        router.push("/admin");
        router.refresh();
        return;
      }

      setMessage("Akun admin tidak valid.");
    });
  }

  function handleDemoAdminLogin() {
    setMessage(null);
    startTransition(async () => {
      const result = await signIn("credentials", {
        email: "admin@zimeirahijab.test",
        password: "password123",
        redirect: false,
      });

      if (result?.ok) {
        router.push("/admin");
        router.refresh();
        return;
      }

      setMessage("Mode demo admin belum tersedia.");
    });
  }

  return (
    <form action={handleLogin} className="grid gap-4">
      {message ? <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</p> : null}
      <Field label="Email">
        <Input name="email" type="email" placeholder="Email admin" required />
      </Field>
      <Field label="Password">
        <Input name="password" type="password" placeholder="Password admin" required />
      </Field>
      <Button type="submit" disabled={isPending}>{isPending ? "Memproses..." : "Masuk Admin"}</Button>
      {portfolioDemoMode ? (
        <Button type="button" variant="outline" disabled={isPending} onClick={handleDemoAdminLogin}>
          Masuk sebagai Admin Demo
        </Button>
      ) : null}
    </form>
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
