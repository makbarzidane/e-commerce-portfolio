import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PackageCheck } from "lucide-react";
import { createVariant, deleteVariant, updateProduct, updateVariant } from "@/app/admin/actions";
import { ProductImageField } from "@/components/admin/product-image-field";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmSubmitButton, SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { requireAdmin } from "@/lib/admin";
import { getAdminCategories, getAdminProductById } from "@/lib/admin-data";
import { formatCurrency } from "@/lib/format";

export default async function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [product, categories] = await Promise.all([getAdminProductById(id), getAdminCategories()]);

  if (!product) notFound();

  const imageUrl = product.images[0]?.url ?? "/images/products/pashmina-rose.svg";
  const stockTotal = product.variants.reduce((total, variant) => total + variant.stock, 0);
  const activeVariants = product.variants.filter((variant) => variant.isActive).length;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/produk" className={buttonVariants({ variant: "outline", size: "sm" })}>
          <ArrowLeft data-icon="inline-start" />
          Kembali
        </Link>
        <div className="flex flex-wrap gap-2">
          <Badge variant={product.isActive ? "default" : "secondary"}>{product.isActive ? "Aktif" : "Nonaktif"}</Badge>
          <Badge variant="outline">{activeVariants} varian aktif</Badge>
          <Badge variant="outline">Stok {stockTotal}</Badge>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Edit Produk</CardTitle>
            <CardDescription>Kelola informasi utama, harga, gambar, label, dan status produk.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateProduct} className="grid gap-4 lg:grid-cols-2">
              <input type="hidden" name="id" value={product.id} />
              <Field label="Nama produk">
                <Input name="name" defaultValue={product.name} required />
              </Field>
              <Field label="Slug">
                <Input name="slug" defaultValue={product.slug} required />
              </Field>
              <Field label="Kategori">
                <select name="categoryId" defaultValue={product.categoryId} required className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Status produk">
                <select name="isActive" defaultValue={String(product.isActive)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
                  <option value="true">Aktif</option>
                  <option value="false">Nonaktif</option>
                </select>
              </Field>
              <Field label="Harga normal">
                <Input name="normalPrice" type="number" min="1" defaultValue={product.normalPrice} required />
              </Field>
              <Field label="Harga diskon">
                <Input name="discountPrice" type="number" min="0" defaultValue={product.discountPrice ?? 0} />
              </Field>
              <div className="lg:col-span-2">
                <Field label="Gambar produk">
                  <ProductImageField defaultValue={imageUrl} />
                </Field>
              </div>
              <div className="lg:col-span-2">
                <Field label="Deskripsi">
                  <Textarea name="description" defaultValue={product.description} className="min-h-32" required />
                </Field>
              </div>
              <div className="flex flex-wrap gap-4 lg:col-span-2">
                <Check name="isNewArrival" label="New arrival" defaultChecked={hasLabel(product.labels, "NEW_ARRIVAL")} />
                <Check name="isBestSeller" label="Best seller" defaultChecked={hasLabel(product.labels, "BEST_SELLER")} />
                <Check name="isDiscount" label="Diskon" defaultChecked={hasLabel(product.labels, "DISCOUNT")} />
              </div>
              <SubmitButton type="submit" className="lg:col-span-2" pendingLabel="Menyimpan produk...">
                Simpan Perubahan Produk
              </SubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview Katalog</CardTitle>
            <CardDescription>Tampilan ringkas produk yang akan muncul di customer.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="overflow-hidden rounded-xl border bg-muted">
              <Image src={imageUrl} alt={product.name} width={720} height={720} className="aspect-square object-cover" />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <PackageCheck data-icon="inline-start" />
                {product.category.name}
              </div>
              <h2 className="text-xl font-semibold">{product.name}</h2>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{formatCurrency(product.discountPrice ?? product.normalPrice)}</span>
                {product.discountPrice ? <span className="text-sm text-muted-foreground line-through">{formatCurrency(product.normalPrice)}</span> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {product.labels.map((label) => (
                  <Badge key={String(label)} variant="secondary">
                    {String(label).replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Varian & Stok</CardTitle>
          <CardDescription>Tambah warna, bahan, SKU, dan stok. Perubahan stok otomatis masuk log inventory.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <form action={createVariant} className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_120px_1fr_1fr_120px_auto]">
            <input type="hidden" name="productId" value={product.id} />
            <Input name="color" placeholder="Warna, contoh: Dusty Rose" required />
            <Input name="colorHex" placeholder="#c99ba0" />
            <Input name="material" placeholder="Bahan, contoh: Voal Premium" required />
            <Input name="sku" placeholder="SKU unik" required />
            <Input name="stock" type="number" min="0" placeholder="Stok" defaultValue={0} />
            <SubmitButton type="submit" pendingLabel="Menambah...">
              Tambah
            </SubmitButton>
          </form>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warna</TableHead>
                  <TableHead>Hex</TableHead>
                  <TableHead>Bahan</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.variants.map((variant) => {
                  const formId = `variant-${variant.id}`;

                  return (
                    <TableRow key={variant.id}>
                      <TableCell>
                        <form id={formId} action={updateVariant} className="contents">
                          <input type="hidden" name="id" value={variant.id} />
                          <input type="hidden" name="productId" value={product.id} />
                          <Input name="color" defaultValue={variant.color} className="min-w-44" required />
                        </form>
                      </TableCell>
                      <TableCell><Input form={formId} name="colorHex" defaultValue={variant.colorHex ?? ""} className="w-28" /></TableCell>
                      <TableCell><Input form={formId} name="material" defaultValue={variant.material} className="min-w-48" required /></TableCell>
                      <TableCell><Input form={formId} name="sku" defaultValue={variant.sku} className="min-w-40" required /></TableCell>
                      <TableCell><Input form={formId} name="stock" type="number" min="0" defaultValue={variant.stock} className="w-24" /></TableCell>
                      <TableCell>
                        <select form={formId} name="isActive" defaultValue={String(variant.isActive)} className="h-9 rounded-lg border border-input bg-background px-2 text-sm">
                          <option value="true">Aktif</option>
                          <option value="false">Nonaktif</option>
                        </select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <SubmitButton form={formId} type="submit" size="sm" variant="outline" pendingLabel="Simpan...">
                            Simpan
                          </SubmitButton>
                          <form action={deleteVariant}>
                            <input type="hidden" name="id" value={variant.id} />
                            <ConfirmSubmitButton type="submit" size="sm" variant="destructive" pendingLabel="Menghapus..." confirmMessage="Hapus varian ini? Jika sudah dipakai transaksi, varian akan dinonaktifkan.">
                              Hapus Aman
                            </ConfirmSubmitButton>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
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

function Check({ name, label, defaultChecked = false }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input name={name} type="checkbox" defaultChecked={defaultChecked} className="size-4 accent-primary" />
      {label}
    </label>
  );
}

function hasLabel(labels: readonly unknown[], label: string) {
  return labels.some((item) => String(item) === label || String(item).toLowerCase().replace(/\s+/g, "_") === label.toLowerCase());
}
