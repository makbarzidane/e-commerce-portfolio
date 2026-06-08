import { createCategory, deleteCategory, updateCategory } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin";
import { getAdminCategories } from "@/lib/admin-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmSubmitButton, SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await getAdminCategories();

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Kategori</CardTitle>
          <CardDescription>Kategori akan langsung tersimpan ke ProductCategory.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createCategory} className="grid gap-4 md:grid-cols-[1fr_1fr_1.4fr_auto] md:items-end">
            <Field label="Nama">
              <Input name="name" placeholder="Pashmina Premium" required />
            </Field>
            <Field label="Slug">
              <Input name="slug" placeholder="pashmina-premium" />
            </Field>
            <Field label="Deskripsi">
              <Input name="description" placeholder="Deskripsi singkat kategori" />
            </Field>
            <SubmitButton type="submit" pendingLabel="Menambah...">Tambah</SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kelola Kategori</CardTitle>
          <CardDescription>Nonaktifkan kategori tanpa menghapus relasi produk.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Urutan</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <form id={`category-${category.id}`} action={updateCategory} className="contents">
                      <input type="hidden" name="id" value={category.id} />
                      <Input name="name" defaultValue={category.name} className="min-w-44" required />
                    </form>
                  </TableCell>
                  <TableCell><Input form={`category-${category.id}`} name="slug" defaultValue={category.slug} className="min-w-44" /></TableCell>
                  <TableCell><Input form={`category-${category.id}`} name="description" defaultValue={category.description ?? ""} className="min-w-56" /></TableCell>
                  <TableCell><Input form={`category-${category.id}`} name="sortOrder" type="number" defaultValue={category.sortOrder} className="w-20" /></TableCell>
                  <TableCell>{category._count.products}</TableCell>
                  <TableCell>
                    <select form={`category-${category.id}`} name="isActive" defaultValue={String(category.isActive)} className="h-9 rounded-lg border border-input bg-background px-2 text-sm">
                      <option value="true">Aktif</option>
                      <option value="false">Nonaktif</option>
                    </select>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <SubmitButton form={`category-${category.id}`} type="submit" size="sm" variant="outline" pendingLabel="Simpan...">
                        Simpan
                      </SubmitButton>
                      <form action={deleteCategory}>
                        <input type="hidden" name="id" value={category.id} />
                        <ConfirmSubmitButton type="submit" size="sm" variant="destructive" pendingLabel="Menghapus..." confirmMessage="Hapus kategori ini? Jika masih punya produk, kategori akan dinonaktifkan.">
                          Hapus Aman
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
