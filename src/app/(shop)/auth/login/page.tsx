import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginRegisterForm } from "@/components/auth/login-register-form";
import { Badge } from "@/components/ui/badge";

export default function LoginPage() {
  const googleAuthEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const portfolioDemoMode = !process.env.DATABASE_URL;

  return (
    <section className="brand-surface min-h-screen">
      <div className="mx-auto grid min-h-[80vh] w-full max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_440px] lg:px-8">
        <div className="hidden flex-col gap-5 lg:flex">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
            Kembali ke toko
          </Link>
          <Badge variant="secondary" className="w-fit">Customer access</Badge>
          <div>
            <h1 className="max-w-xl text-5xl font-semibold tracking-tight">Masuk untuk checkout koleksi hijab favorit.</h1>
            <p className="mt-4 max-w-lg text-muted-foreground">Akun Google verified digunakan untuk menyimpan wishlist, alamat pengiriman, status pembayaran, dan Pesanan Saya.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border bg-background/70 p-4 text-sm text-muted-foreground">
            <ShieldCheck className="size-5 text-primary" />
            Login customer terpisah dari admin dan dilindungi session NextAuth.
          </div>
        </div>

        <Card className="w-full rounded-2xl bg-card/95 shadow-xl shadow-primary/10">
          <CardHeader>
            <CardTitle>Login / Sign up</CardTitle>
            <CardDescription>Masuk sebagai customer dengan akun Google verified untuk mulai belanja.</CardDescription>
        </CardHeader>
        <Suspense fallback={null}>
          <LoginRegisterForm googleAuthEnabled={googleAuthEnabled} portfolioDemoMode={portfolioDemoMode} />
        </Suspense>
        </Card>
      </div>
    </section>
  );
}
