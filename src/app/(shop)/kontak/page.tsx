import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { storeSettings } from "@/lib/data";

export default function ContactPage() {
  return (
    <section className="brand-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[440px_1fr] lg:px-8">
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">Contact</p>
          <h1 className="text-4xl font-semibold tracking-tight">Visit Zimeira in Pagar Alam.</h1>
          <p className="leading-7 text-muted-foreground">
            Zimeira Hijab Store is a fictional hijab brand based in Pagar Alam, South Sumatra. Use this page as the demo contact center for product questions, order support, shipping, and collaboration inquiries.
          </p>
          <Info icon={Mail} title="Email" text={storeSettings.email} />
          <Info icon={Phone} title="Phone & WhatsApp" text={storeSettings.phone} />
          <Info icon={MapPin} title="Location" text={storeSettings.address} />
          <div className="rounded-lg border bg-card/80 p-4 text-sm leading-6 text-muted-foreground">
            <span className="font-medium text-foreground">Store note:</span> This demo brand was established in 2026 and all contact details are fictional for portfolio use.
          </div>
        </div>
        <Card className="border-primary/15 bg-card/90 shadow-xl">
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
      </div>
    </section>
  );
}

function Info({ icon: Icon, title, text }: { icon: typeof Mail; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-lg border bg-card p-4">
      <Icon className="mt-1 size-4 text-primary" />
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-2"><Label>{label}</Label>{children}</div>;
}
