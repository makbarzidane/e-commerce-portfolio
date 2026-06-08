import { createBanner, deleteBanner, updateBanner } from "@/app/admin/actions";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { requireAdmin } from "@/lib/admin";
import { getAdminBanners } from "@/lib/admin-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmSubmitButton, SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminBannersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const pageSize = 20;
  const banners = await getAdminBanners({ q: params.q, status: params.status, page, pageSize });

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Banner Promo</CardTitle>
          <CardDescription>Banner dapat dipakai di homepage atau campaign katalog.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createBanner} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 xl:items-end">
            <Field label="Judul"><Input name="title" placeholder="New modest essentials" required /></Field>
            <Field label="Subtitle"><Input name="subtitle" placeholder="Koleksi hijab lembut" /></Field>
            <Field label="Image URL"><Input name="imageUrl" defaultValue="/images/products/pashmina-rose.svg" /></Field>
            <Field label="CTA Label"><Input name="ctaLabel" placeholder="Belanja koleksi" /></Field>
            <Field label="CTA Link"><Input name="ctaHref" placeholder="/produk" /></Field>
            <Field label="Urutan"><Input name="sortOrder" type="number" min="0" defaultValue="0" /></Field>
            <SubmitButton type="submit" className="xl:col-span-3" pendingLabel="Menyimpan banner...">Simpan Banner</SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kelola Banner Promo</CardTitle>
          <CardDescription>Nonaktifkan banner yang sudah selesai campaign.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_auto]">
            <Input name="q" defaultValue={params.q ?? ""} placeholder="Cari judul atau subtitle banner" />
            <select name="status" defaultValue={params.status ?? ""} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
              <option value="">Semua status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
            <SubmitButton type="submit" variant="outline" pendingLabel="Filter...">Filter</SubmitButton>
          </form>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead>Subtitle</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>CTA</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Urutan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell>
                    <form id={`banner-${banner.id}`} action={updateBanner} className="contents">
                      <input type="hidden" name="id" value={banner.id} />
                      <Input name="title" defaultValue={banner.title} className="min-w-56" required />
                    </form>
                  </TableCell>
                  <TableCell><Input form={`banner-${banner.id}`} name="subtitle" defaultValue={banner.subtitle ?? ""} className="min-w-56" /></TableCell>
                  <TableCell><Input form={`banner-${banner.id}`} name="imageUrl" defaultValue={banner.imageUrl} className="min-w-64" /></TableCell>
                  <TableCell><Input form={`banner-${banner.id}`} name="ctaLabel" defaultValue={banner.ctaLabel ?? ""} className="min-w-40" /></TableCell>
                  <TableCell><Input form={`banner-${banner.id}`} name="ctaHref" defaultValue={banner.ctaHref ?? ""} className="min-w-40" /></TableCell>
                  <TableCell><Input form={`banner-${banner.id}`} name="sortOrder" type="number" min="0" defaultValue={banner.sortOrder} className="w-20" /></TableCell>
                  <TableCell>
                    <select form={`banner-${banner.id}`} name="isActive" defaultValue={String(banner.isActive)} className="h-9 rounded-lg border border-input bg-background px-2 text-sm">
                      <option value="true">Aktif</option>
                      <option value="false">Nonaktif</option>
                    </select>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <SubmitButton form={`banner-${banner.id}`} type="submit" size="sm" variant="outline" pendingLabel="Simpan...">Simpan</SubmitButton>
                      <form action={deleteBanner}>
                        <input type="hidden" name="id" value={banner.id} />
                        <ConfirmSubmitButton type="submit" size="sm" variant="destructive" pendingLabel="Menghapus..." confirmMessage="Hapus banner promo ini secara permanen?">
                          Hapus
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationControls
            basePath="/admin/banner"
            page={page}
            hasNext={banners.length === pageSize}
            params={{ q: params.q, status: params.status }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-2"><Label>{label}</Label>{children}</div>;
}
