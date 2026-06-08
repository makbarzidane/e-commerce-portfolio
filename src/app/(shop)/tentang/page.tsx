import { Card, CardContent } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Tentang Zimeira Hijab Store</h1>
        <p className="mt-4 leading-8 text-muted-foreground">
          Zimeira Hijab Store adalah brand demo untuk custom ecommerce hijab. Tahap pertama ini fokus pada fondasi UI, struktur database, dummy data, dan kesiapan integrasi layanan eksternal.
        </p>
      </div>
      <Card>
        <CardContent className="grid gap-4 p-6">
          {["Koleksi hijab modest modern", "Varian warna dan bahan per produk", "Admin panel siap CRUD", "Roadmap payment, ongkir, dan upload gambar"].map((item) => (
            <div key={item} className="rounded-lg border bg-muted/30 p-4 font-medium">{item}</div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
