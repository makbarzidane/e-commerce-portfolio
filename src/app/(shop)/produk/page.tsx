import { ProductFilters } from "@/components/product/product-filters";
import { getStoreCategories, getStoreProductsForCurrentCustomer } from "@/lib/store-data";

export default async function ProductsPage() {
  const [categories, products] = await Promise.all([getStoreCategories(), getStoreProductsForCurrentCustomer()]);

  return (
    <section className="brand-surface min-h-screen">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <ProductFilters categories={categories} products={products} />
      </div>
    </section>
  );
}
