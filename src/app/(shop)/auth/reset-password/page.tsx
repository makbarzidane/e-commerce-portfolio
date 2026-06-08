import Link from "next/link";
import { ArrowLeft, MailCheck, ShieldCheck } from "lucide-react";
import { requestPasswordResetCode, resetPasswordWithCode } from "@/app/(shop)/auth/actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; email?: string; error?: string; status?: string; devCode?: string }>;
}) {
  const params = await searchParams;
  const defaultEmail = params.email ?? "";

  return (
    <section className="brand-surface min-h-screen">
      <div className="mx-auto grid min-h-[80vh] w-full max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_460px] lg:px-8">
        <div className="hidden flex-col gap-5 lg:flex">
          <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
            Kembali ke login
          </Link>
          <Badge variant="secondary" className="w-fit">Password recovery</Badge>
          <div>
            <h1 className="max-w-xl text-5xl font-semibold tracking-tight">Reset password dengan kode email.</h1>
            <p className="mt-4 max-w-lg text-muted-foreground">
              Masukkan email akun, cek kode 6 digit di inbox, lalu buat password baru.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border bg-background/70 p-4 text-sm text-muted-foreground">
            <ShieldCheck className="size-5 text-primary" />
            Kode reset berlaku 15 menit dan otomatis tidak bisa dipakai ulang.
          </div>
        </div>

        <Card className="w-full rounded-2xl bg-card/95 shadow-xl shadow-primary/10">
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>Kode reset akan dikirim ke email akun customer.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {params.sent === "1" ? (
              <Notice tone={params.status === "email-failed" ? "error" : "success"}>
                {params.status === "email-failed"
                  ? "Kode berhasil dibuat, tapi email belum terkirim. Periksa konfigurasi Resend."
                  : "Jika email terdaftar, kode reset sudah dikirim. Periksa inbox atau folder spam."}
              </Notice>
            ) : null}
            {params.devCode ? (
              <div className="rounded-xl border border-primary/20 bg-secondary/70 p-3 text-sm">
                <p className="font-medium text-foreground">Kode reset mode development</p>
                <p className="mt-2 text-2xl font-semibold tracking-[0.28em] text-primary">{params.devCode}</p>
                <p className="mt-2 text-xs text-muted-foreground">Kode ini hanya ditampilkan saat `NODE_ENV` bukan production.</p>
              </div>
            ) : null}
            {params.error ? <Notice tone="error">{getErrorMessage(params.error)}</Notice> : null}

            <form action={requestPasswordResetCode} className="grid gap-4 rounded-2xl border bg-background/70 p-4">
              <div className="flex items-center gap-2 font-medium">
                <MailCheck className="size-4 text-primary" />
                Kirim kode reset
              </div>
              <Field label="Email">
                <Input name="email" type="email" defaultValue={defaultEmail} placeholder="email@example.com" required />
              </Field>
              <SubmitButton type="submit" pendingLabel="Mengirim kode...">
                Kirim Kode ke Email
              </SubmitButton>
            </form>

            <form action={resetPasswordWithCode} className="grid gap-4 rounded-2xl border bg-background/70 p-4">
              <div className="font-medium">Masukkan kode dan password baru</div>
              <Field label="Email">
                <Input name="email" type="email" defaultValue={defaultEmail} placeholder="email@example.com" required />
              </Field>
              <Field label="Kode reset">
                <Input name="code" inputMode="numeric" maxLength={6} placeholder="6 digit" required />
              </Field>
              <Field label="Password baru">
                <Input name="password" type="password" minLength={8} placeholder="Minimal 8 karakter" required />
              </Field>
              <SubmitButton type="submit" pendingLabel="Menyimpan password...">
                Simpan Password Baru
              </SubmitButton>
            </form>

            <Link href="/auth/login" className={buttonVariants({ variant: "outline" })}>
              Kembali ke Login
            </Link>
          </CardContent>
        </Card>
      </div>
    </section>
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
    <div className={tone === "error" ? "rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" : "rounded-xl border bg-secondary/60 p-3 text-sm text-secondary-foreground"}>
      {children}
    </div>
  );
}

function getErrorMessage(error: string) {
  if (error === "rate-limit") return "Terlalu banyak percobaan. Coba lagi beberapa menit.";
  if (error === "reset-validation") return "Email, kode 6 digit, dan password minimal 8 karakter wajib diisi.";
  if (error === "code-invalid") return "Kode reset salah, kadaluarsa, atau sudah dipakai.";
  return "Reset password belum berhasil. Coba lagi.";
}
