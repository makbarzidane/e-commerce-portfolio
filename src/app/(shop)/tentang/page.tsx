import { Card, CardContent } from "@/components/ui/card";

export default function AboutPage() {
  const values = [
    "Founded in Pagar Alam in 2026",
    "Soft colors inspired by modest daily wear",
    "Curated hijab, inner, and accessory essentials",
    "Prepared for online orders across Indonesia",
  ];

  return (
    <section className="brand-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div className="flex flex-col justify-center">
          <span className="h-1 w-20 rounded-full bg-[var(--gold)]" />
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.28em] text-primary">Pagar Alam, 2026</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">About Zimeira Hijab Store</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Zimeira Hijab Store is a fictional modest fashion brand from Pagar Alam, South Sumatra. Founded in 2026, Zimeira was imagined for women who love soft colors, comfortable fabrics, and polished hijab styling for daily routines, work, campus, travel, and special moments.
          </p>
          <p className="mt-4 max-w-2xl leading-8 text-muted-foreground">
            The brand direction combines dusty pink, cream, soft black, and subtle gold accents to create an elegant local hijab store experience. Every product in this demo is dummy data, designed to represent a warm, premium, and practical ecommerce catalog.
          </p>
        </div>
        <Card className="overflow-hidden border-primary/15 bg-card/85 shadow-xl">
          <CardContent className="grid gap-4 p-6 sm:p-8">
            <div className="rounded-lg bg-primary/10 p-5">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">Brand Story</p>
              <h2 className="mt-3 text-2xl font-semibold">Soft modest essentials from Pagar Alam.</h2>
              <p className="mt-3 leading-7 text-muted-foreground">
                Zimeira focuses on breathable hijab materials, neat finishing, and versatile shades that are easy to pair with modern modest outfits.
              </p>
            </div>
            {values.map((item) => (
              <div key={item} className="rounded-lg border bg-muted/30 p-4 font-medium">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
