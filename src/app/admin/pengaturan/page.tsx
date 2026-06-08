import { updateStoreSetting } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin";
import { getAdminStoreSetting } from "@/lib/admin-data";
import { getCloudinaryUploadConfig } from "@/lib/integrations/upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getAdminStoreSetting();
  const cloudinary = getCloudinaryUploadConfig();
  const integrations = [
    {
      name: "Google Login",
      description: "Login/register customer dengan akun Google verified.",
      ready: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      env: "GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET",
    },
    {
      name: "Midtrans",
      description: "Payment gateway checkout dan webhook otomatis.",
      ready: Boolean(process.env.MIDTRANS_SERVER_KEY && process.env.MIDTRANS_CLIENT_KEY),
      env: "MIDTRANS_SERVER_KEY, MIDTRANS_CLIENT_KEY, MIDTRANS_IS_PRODUCTION",
    },
    {
      name: "Resend Email",
      description: "Email reset password dan notifikasi order.",
      ready: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL && !process.env.RESEND_FROM_EMAIL.includes("onboarding@resend.dev")),
      env: "RESEND_API_KEY, RESEND_FROM_EMAIL domain terverifikasi",
    },
    {
      name: "OTP WhatsApp/SMS",
      description: "Kode verifikasi nomor HP customer.",
      ready: Boolean(process.env.FONNTE_API_KEY),
      env: "FONNTE_API_KEY",
    },
    {
      name: "RajaOngkir / Biteship",
      description: "Kalkulasi ongkir real dan fondasi tracking.",
      ready: Boolean(process.env.RAJAONGKIR_API_KEY || process.env.BITESHIP_API_KEY),
      env: "RAJAONGKIR_API_KEY atau BITESHIP_API_KEY",
    },
    {
      name: "Cloudinary",
      description: "Upload gambar produk admin.",
      ready: cloudinary.isConfigured,
      env: "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET",
    },
    {
      name: "Security Secret",
      description: "Secret Auth kuat untuk session production.",
      ready: Boolean(process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length >= 32 && !process.env.NEXTAUTH_SECRET.includes("replace")),
      env: "NEXTAUTH_SECRET minimal 32 karakter acak",
    },
  ];

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Toko</CardTitle>
          <CardDescription>Data disimpan ke StoreSetting dan siap dipakai oleh halaman toko.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateStoreSetting} className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama toko"><Input name="storeName" defaultValue={"storeName" in settings ? settings.storeName : settings.name} required /></Field>
            <Field label="Email"><Input name="email" defaultValue={settings.email ?? ""} /></Field>
            <Field label="Telepon"><Input name="phone" defaultValue={settings.phone ?? ""} /></Field>
            <Field label="Instagram"><Input name="instagram" defaultValue={settings.instagram ?? ""} /></Field>
            <Field label="WhatsApp"><Input name="whatsapp" defaultValue={"whatsapp" in settings ? settings.whatsapp ?? "" : ""} /></Field>
            <div className="sm:col-span-2"><Field label="Alamat"><Input name="address" defaultValue={settings.address ?? ""} /></Field></div>
            <Button type="submit" className="sm:col-span-2">Simpan Pengaturan</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status Integrasi</CardTitle>
          <CardDescription>Mode demo tetap berjalan. Isi env berikut untuk mengaktifkan layanan production.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {integrations.map((item) => (
            <div key={item.name} className="rounded-2xl border bg-background/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </div>
                <Badge variant={item.ready ? "secondary" : "outline"}>{item.ready ? "Siap" : "Demo"}</Badge>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">{item.env}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-2"><Label>{label}</Label>{children}</div>;
}
