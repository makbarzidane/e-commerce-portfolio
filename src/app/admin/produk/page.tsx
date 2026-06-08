import { bulkUpdateProducts, createProduct, deleteProduct, updateProduct } from "@/app/admin/actions";
import Link from "next/link";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { ProductImageField } from "@/components/admin/product-image-field";
import { requireAdmin } from "@/lib/admin";
import { getAdminCategories, getAdminProducts } from "@/lib/admin-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmSubmitButton, SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const pageSize = 20;
  const [products, categories] = await Promise.all([
    getAdminProducts({
      q: params.q,
      status: params.status,
      page,
      pageSize,
    }),
    getAdminCategories(),
  ]);

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Produk</CardTitle>
          <CardDescription>Produk baru memakai placeholder image sampai Cloudinary diaktifkan.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createProduct} className="grid gap-4 lg:grid-cols-2">
            <Field label="Nama produk">
              <Input name="name" placeholder="Zimeira Pashmina Voal Nude" required />
            </Field>
            <Field label="Slug">
              <Input name="slug" placeholder="zimeira-pashmina-voal-nude" />
            </Field>
            <Field label="Kategori">
              <select name="categoryId" required className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
                <option value="">Pilih kategori</option>
                {categories.filter((category) => category.isActive).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="URL gambar">
              <ProductImageField />
            </Field>
            <Field label="Harga normal">
              <Input name="normalPrice" type="number" min="1" placeholder="129000" required />
            </Field>
            <Field label="Harga diskon">
              <Input name="discountPrice" type="number" min="0" placeholder="99000" />
            </Field>
            <div className="lg:col-span-2">
              <Field label="Deskripsi">
                <Textarea name="description" placeholder="Deskripsi produk..." required />
              </Field>
            </div>
            <div className="flex flex-wrap gap-4 lg:col-span-2">
              <Check name="isNewArrival" label="New arrival" />
              <Check name="isBestSeller" label="Best seller" />
              <Check name="isDiscount" label="Diskon" />
            </div>
            <SubmitButton type="submit" className="lg:col-span-2" pendingLabel="Menyimpan produk...">Simpan Produk</SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kelola Produk</CardTitle>
          <CardDescription>Nonaktifkan produk agar riwayat order lama tetap aman.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_auto]">
            <Input name="q" defaultValue={params.q ?? ""} placeholder="Cari nama atau slug produk" />
            <select name="status" defaultValue={params.status ?? ""} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
              <option value="">Semua status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
            <SubmitButton type="submit" variant="outline" pendingLabel="Filter...">Filter</SubmitButton>
          </form>
          <form id="bulk-products" action={bulkUpdateProducts} className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border bg-muted/35 p-3">
            <p className="w-full text-sm text-muted-foreground">
              Centang produk di tabel, lalu pilih aksi untuk mengaktifkan atau menonaktifkan banyak produk sekaligus.
            </p>
            <select name="bulkAction" className="h-9 rounded-lg border border-input bg-background px-3 text-sm" required>
              <option value="">Bulk action</option>
              <option value="activate">Aktifkan produk terpilih</option>
              <option value="deactivate">Nonaktifkan produk terpilih</option>
            </select>
            <ConfirmSubmitButton type="submit" size="sm" variant="outline" pendingLabel="Memproses..." confirmMessage="Jalankan bulk action untuk produk yang dicentang?">
              Terapkan
            </ConfirmSubmitButton>
          </form>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pilih</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Image URL</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Harga Normal</TableHead>
                <TableHead>Harga Diskon</TableHead>
                <TableHead>Varian</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <input form="bulk-products" type="checkbox" name="productId" value={product.id} className="size-4 accent-primary" aria-label={`Pilih ${product.name}`} />
                  </TableCell>
                  <TableCell>
                    <form id={`product-${product.id}`} action={updateProduct} className="contents">
                      <input type="hidden" name="id" value={product.id} />
                      <Input name="name" defaultValue={product.name} className="min-w-56" required />
                    </form>
                  </TableCell>
                  <TableCell><Input form={`product-${product.id}`} name="slug" defaultValue={product.slug} className="min-w-56" /></TableCell>
                  <TableCell><Textarea form={`product-${product.id}`} name="description" defaultValue={product.description} className="min-w-72" /></TableCell>
                  <TableCell>
                    <div className="min-w-80">
                      <ProductImageField form={`product-${product.id}`} defaultValue={product.images[0]?.url ?? "/images/products/pashmina-rose.svg"} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <select form={`product-${product.id}`} name="categoryId" defaultValue={product.categoryId} className="h-9 min-w-44 rounded-lg border border-input bg-background px-2 text-sm">
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell><Input form={`product-${product.id}`} name="normalPrice" type="number" min="1" defaultValue={product.normalPrice} className="w-32" /></TableCell>
                  <TableCell><Input form={`product-${product.id}`} name="discountPrice" type="number" min="0" defaultValue={product.discountPrice ?? 0} className="w-32" /></TableCell>
                  <TableCell>{product.variants.length}</TableCell>
                  <TableCell>
                    <div className="flex min-w-44 flex-col gap-1 text-xs">
                      <Check form={`product-${product.id}`} name="isNewArrival" label="New" defaultChecked={hasLabel(product.labels, "NEW_ARRIVAL")} />
                      <Check form={`product-${product.id}`} name="isBestSeller" label="Best" defaultChecked={hasLabel(product.labels, "BEST_SELLER")} />
                      <Check form={`product-${product.id}`} name="isDiscount" label="Diskon" defaultChecked={hasLabel(product.labels, "DISCOUNT")} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <select form={`product-${product.id}`} name="isActive" defaultValue={String(product.isActive)} className="h-9 rounded-lg border border-input bg-background px-2 text-sm">
                      <option value="true">Aktif</option>
                      <option value="false">Nonaktif</option>
                    </select>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <SubmitButton form={`product-${product.id}`} type="submit" size="sm" variant="outline" pendingLabel="Simpan...">
                        Simpan
                      </SubmitButton>
                      <Link href={`/admin/produk/${product.id}`} className={buttonVariants({ size: "sm", variant: "outline" })}>
                        Edit
                      </Link>
                      <form action={deleteProduct}>
                        <input type="hidden" name="id" value={product.id} />
                        <ConfirmSubmitButton type="submit" size="sm" variant="destructive" pendingLabel="Menghapus..." confirmMessage="Hapus produk ini? Jika sudah punya transaksi, produk akan dinonaktifkan agar riwayat order tetap aman.">
                          Hapus Aman
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationControls
            basePath="/admin/produk"
            page={page}
            hasNext={products.length === pageSize}
            params={{ q: params.q, status: params.status }}
          />
        </CardContent>
      </Card>
    </div>
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

function Check({ name, label, form, defaultChecked = false }: { name: string; label: string; form?: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input form={form} name={name} type="checkbox" defaultChecked={defaultChecked} className="size-4 accent-primary" />
      {label}
    </label>
  );
}

function hasLabel(labels: readonly unknown[], label: string) {
  return labels.some((item) => String(item) === label || String(item).toLowerCase().replace(/\s+/g, "_") === label.toLowerCase());
}
