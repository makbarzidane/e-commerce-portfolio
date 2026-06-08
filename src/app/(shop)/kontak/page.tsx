import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { storeSettings } from "@/lib/data";

export default function ContactPage() {
  return (
    <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[420px_1fr] lg:px-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Kontak</h1>
        <Info icon={Mail} text={storeSettings.email} />
        <Info icon={Phone} text={storeSettings.phone} />
        <Info icon={MapPin} text={storeSettings.address} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Kirim Pesan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Field label="Nama"><Input placeholder="Nama lengkap" /></Field>
          <Field label="Email"><Input placeholder="email@example.com" /></Field>
          <Field label="Pesan"><Textarea placeholder="Tulis pesan..." /></Field>
          <Button>Kirim Pesan</Button>
        </CardContent>
      </Card>
    </section>
  );
}

function Info({ icon: Icon, text }: { icon: typeof Mail; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
      <Icon className="size-4 text-primary" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-2"><Label>{label}</Label>{children}</div>;
}
