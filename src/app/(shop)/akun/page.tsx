import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, PackageSearch, Phone } from "lucide-react";
import { requestPhoneVerification, updateCustomerProfile, verifyPhoneCode } from "@/app/(shop)/akun/actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentCustomer } from "@/lib/customer-data";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ verifyPhone?: string }>;
}) {
  const customer = await getCurrentCustomer();
  if (!customer) {
    redirect("/auth/login?callbackUrl=/akun");
  }

  const params = await searchParams;
  const address = customer.shippingAddresses[0];
  const phone = customer.phone ?? address?.phone ?? "";
  const isPhoneVerified = Boolean(customer.phoneVerifiedAt && customer.phone === phone);

  return (
    <section className="brand-surface min-h-screen">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[320px_1fr] lg:px-8">
        <div className="flex flex-col gap-4">
          <Card className="h-fit rounded-2xl bg-card/95 shadow-sm">
            <CardHeader>
              <CardTitle>Akun Saya</CardTitle>
              <CardDescription>{customer.email}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Link href="/lacak" className={buttonVariants({ variant: "outline", className: "justify-start" })}>
                <PackageSearch data-icon="inline-start" />
                Pesanan Saya
              </Link>
              <div className="rounded-xl border bg-background/70 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Nomor HP</span>
                  <Badge variant={isPhoneVerified ? "secondary" : "outline"}>
                    {isPhoneVerified ? "Terverifikasi" : "Belum"}
                  </Badge>
                </div>
                <p className="mt-2 font-medium">{phone || "Belum diisi"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-5">
          {params.verifyPhone === "required" ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
              Verifikasi nomor HP terlebih dahulu sebelum checkout.
            </div>
          ) : null}
          <Card className="rounded-2xl bg-card/95 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="size-4" />
                Verifikasi Nomor HP
              </CardTitle>
              <CardDescription>Checkout diwajibkan memakai nomor HP aktif yang sudah diverifikasi.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className={isPhoneVerified ? "rounded-2xl border border-primary/20 bg-secondary/50 p-4 text-sm" : "rounded-2xl border bg-muted/40 p-4 text-sm text-muted-foreground"}>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className={isPhoneVerified ? "size-5 text-primary" : "size-5 text-muted-foreground"} />
                  <div>
                    <p className="font-medium text-foreground">{isPhoneVerified ? "Nomor HP sudah terverifikasi" : "Nomor HP belum terverifikasi"}</p>
                    <p className="mt-1">{isPhoneVerified ? "Nomor ini bisa dipakai untuk checkout dan notifikasi pesanan." : "Minta kode OTP, lalu masukkan kode 6 digit untuk membuka checkout."}</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <form action={requestPhoneVerification} className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <Input name="phone" defaultValue={phone} placeholder="081234567890" required />
                  <SubmitButton type="submit" variant="outline" pendingLabel="Mengirim...">
                    Kirim OTP
                  </SubmitButton>
                </form>
                <form action={verifyPhoneCode} className="grid gap-3 sm:grid-cols-[160px_auto]">
                  <Input name="code" placeholder="6 digit" inputMode="numeric" maxLength={6} required />
                  <SubmitButton type="submit" pendingLabel="Verifikasi...">
                    Verifikasi
                  </SubmitButton>
                </form>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl bg-card/95 shadow-sm">
            <CardHeader>
              <CardTitle>Profil Customer</CardTitle>
              <CardDescription>Perbarui data profil dan alamat utama untuk checkout.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateCustomerProfile} className="grid gap-4 sm:grid-cols-2">
                <Field label="Nama">
                  <Input name="name" defaultValue={customer.name ?? ""} required />
                </Field>
                <Field label="Email">
                  <Input defaultValue={customer.email} readOnly />
                </Field>
                <Field label="Nomor HP">
                  <Input name="phone" defaultValue={phone} placeholder="081234567890" />
                </Field>
                <Field label="URL Foto Profil">
                  <Input name="image" defaultValue={customer.image ?? ""} placeholder="/images/avatar-demo.png" />
                </Field>
                <Field label="Nama Penerima">
                  <Input name="recipient" defaultValue={address?.recipient ?? customer.name ?? ""} />
                </Field>
                <Field label="Provinsi">
                  <Input name="province" defaultValue={address?.province ?? ""} />
                </Field>
                <Field label="Kota/Kabupaten">
                  <Input name="city" defaultValue={address?.city ?? ""} />
                </Field>
                <Field label="Kecamatan">
                  <Input name="district" defaultValue={address?.district ?? ""} />
                </Field>
                <Field label="Kode Pos">
                  <Input name="postalCode" defaultValue={address?.postalCode ?? ""} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Alamat Lengkap">
                    <Textarea name="addressLine" defaultValue={address?.addressLine ?? ""} placeholder="Nama jalan, nomor rumah, patokan" />
                  </Field>
                </div>
                <SubmitButton type="submit" className="sm:col-span-2" pendingLabel="Menyimpan profil...">Simpan Perubahan</SubmitButton>
              </form>
            </CardContent>
          </Card>
        </div>
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
