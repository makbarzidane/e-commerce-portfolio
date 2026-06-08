import { createVariant, deleteVariant, updateVariant } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin";
import { getAdminProducts, getAdminVariants } from "@/lib/admin-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmSubmitButton, SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminVariantsPage() {
  await requireAdmin();
  const [products, variants] = await Promise.all([getAdminProducts(), getAdminVariants()]);
  const variantsByCategory = variants.reduce<Record<string, typeof variants>>((groups, variant) => {
    const key = variant.categoryName ?? "Tanpa Kategori";
    groups[key] = groups[key] ?? [];
    groups[key].push(variant);
    return groups;
  }, {});

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Varian Produk</CardTitle>
          <CardDescription>Atur warna, bahan, SKU, dan stok per varian.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createVariant} className="grid gap-4 md:grid-cols-3 xl:grid-cols-6 xl:items-end">
            <Field label="Produk">
              <select name="productId" required className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
                <option value="">Pilih produk</option>
                {products.filter((product) => product.isActive).map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Warna">
              <Input name="color" placeholder="Dusty Rose" required />
            </Field>
            <Field label="Hex">
              <Input name="colorHex" placeholder="#c9969a" />
            </Field>
            <Field label="Bahan">
              <Input name="material" placeholder="Premium Voal" required />
            </Field>
            <Field label="SKU">
              <Input name="sku" placeholder="ZIM-PAS-ROS-VOAL" required />
            </Field>
            <Field label="Stok">
              <Input name="stock" type="number" min="0" defaultValue="0" />
            </Field>
            <SubmitButton type="submit" className="xl:col-span-6" pendingLabel="Menyimpan varian...">Simpan Varian</SubmitButton>
          </form>
        </CardContent>
      </Card>

      {Object.entries(variantsByCategory).map(([category, categoryVariants]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle>{category}</CardTitle>
            <CardDescription>{categoryVariants.length} varian. Hapus varian jika belum dipakai di transaksi aktif.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
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
                {categoryVariants.map((variant) => (
                  <TableRow key={variant.id}>
                    <TableCell>
                      <form id={`variant-${variant.id}`} action={updateVariant} className="contents">
                        <input type="hidden" name="id" value={variant.id} />
                        <select name="productId" defaultValue={variant.productId} className="h-9 min-w-56 rounded-lg border border-input bg-background px-2 text-sm">
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>{product.name}</option>
                          ))}
                        </select>
                      </form>
                    </TableCell>
                    <TableCell><Input form={`variant-${variant.id}`} name="color" defaultValue={variant.color} className="min-w-36" /></TableCell>
                    <TableCell><Input form={`variant-${variant.id}`} name="colorHex" defaultValue={variant.colorHex ?? ""} className="w-28" /></TableCell>
                    <TableCell><Input form={`variant-${variant.id}`} name="material" defaultValue={variant.material} className="min-w-40" /></TableCell>
                    <TableCell><Input form={`variant-${variant.id}`} name="sku" defaultValue={variant.sku} className="min-w-44" /></TableCell>
                    <TableCell><Input form={`variant-${variant.id}`} name="stock" type="number" min="0" defaultValue={variant.stock} className="w-24" /></TableCell>
                    <TableCell>
                      <select form={`variant-${variant.id}`} name="isActive" defaultValue={String(variant.isActive)} className="h-9 rounded-lg border border-input bg-background px-2 text-sm">
                        <option value="true">Aktif</option>
                        <option value="false">Nonaktif</option>
                      </select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <SubmitButton form={`variant-${variant.id}`} type="submit" size="sm" variant="outline" pendingLabel="Simpan...">
                          Simpan
                        </SubmitButton>
                        <form action={deleteVariant}>
                          <input type="hidden" name="id" value={variant.id} />
                          <ConfirmSubmitButton type="submit" size="sm" variant="destructive" pendingLabel="Menghapus..." confirmMessage="Hapus varian ini? Jika sudah dipakai transaksi, varian akan dinonaktifkan.">
                            Hapus
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
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
