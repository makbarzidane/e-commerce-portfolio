"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/product/product-card";
import type { StoreCategory, StoreProduct } from "@/lib/store-data";

const colors = ["Dusty Rose", "Cream", "Black", "Gold", "Sage", "Mocha"];

export function ProductFilters({ categories, products }: { categories: StoreCategory[]; products: StoreProduct[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [price, setPrice] = useState("all");
  const [color, setColor] = useState("all");

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const productPrice = product.discountPrice ?? product.normalPrice;
      const matchesQuery = product.name.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === "all" || product.categorySlug === category;
      const matchesPrice =
        price === "all" ||
        (price === "under-100" && productPrice < 100000) ||
        (price === "100-150" && productPrice >= 100000 && productPrice <= 150000) ||
        (price === "above-150" && productPrice > 150000);
      const matchesColor =
        color === "all" || product.colors.some((item) => item.toLowerCase().includes(color.toLowerCase()));

      return matchesQuery && matchesCategory && matchesPrice && matchesColor;
    });
  }, [query, category, price, color, products]);

  return (
    <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
      <aside className="silk-panel h-fit rounded-2xl border bg-card/80 p-5 shadow-sm">
        <div className="flex flex-col gap-5">
          <div>
            <p className="mb-2 text-sm font-medium">Search produk</p>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Cari pashmina..." />
            </div>
          </div>
          <FilterGroup label="Kategori">
            <FilterButton active={category === "all"} onClick={() => setCategory("all")}>Semua</FilterButton>
            {categories.map((item) => (
              <FilterButton key={item.slug} active={category === item.slug} onClick={() => setCategory(item.slug)}>
                {item.name}
              </FilterButton>
            ))}
          </FilterGroup>
          <FilterGroup label="Harga">
            <FilterButton active={price === "all"} onClick={() => setPrice("all")}>Semua</FilterButton>
            <FilterButton active={price === "under-100"} onClick={() => setPrice("under-100")}>Di bawah 100rb</FilterButton>
            <FilterButton active={price === "100-150"} onClick={() => setPrice("100-150")}>100rb - 150rb</FilterButton>
            <FilterButton active={price === "above-150"} onClick={() => setPrice("above-150")}>Di atas 150rb</FilterButton>
          </FilterGroup>
          <FilterGroup label="Warna">
            <FilterButton active={color === "all"} onClick={() => setColor("all")}>Semua</FilterButton>
            {colors.map((item) => (
              <FilterButton key={item} active={color === item} onClick={() => setColor(item)}>
                {item}
              </FilterButton>
            ))}
          </FilterGroup>
        </div>
      </aside>
      <section className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Katalog Produk</h1>
            <p className="text-sm text-muted-foreground">{filtered.length} produk dummy tersedia</p>
          </div>
          <Badge variant="secondary">Tahap 1</Badge>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} wishlistReturnTo="/produk" />
          ))}
        </div>
      </section>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <Button type="button" size="sm" variant={active ? "default" : "outline"} onClick={onClick}>
      {children}
    </Button>
  );
}
