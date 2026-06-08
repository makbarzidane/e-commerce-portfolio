import { createCoupon, deleteCoupon, updateCoupon } from "@/app/admin/actions";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { requireAdmin } from "@/lib/admin";
import { getAdminCoupons } from "@/lib/admin-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmSubmitButton, SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminCouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const pageSize = 20;
  const coupons = await getAdminCoupons({ q: params.q, status: params.status, page, pageSize });

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Voucher</CardTitle>
          <CardDescription>Voucher akan tersedia untuk checkout tahap berikutnya.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createCoupon} className="grid gap-4 md:grid-cols-3 xl:grid-cols-6 xl:items-end">
            <Field label="Kode"><Input name="code" placeholder="ZIMEIRA10" required /></Field>
            <Field label="Deskripsi"><Input name="description" placeholder="Diskon campaign" /></Field>
            <Field label="Diskon %"><Input name="discountPercent" type="number" min="0" max="100" /></Field>
            <Field label="Diskon nominal"><Input name="discountAmount" type="number" min="0" /></Field>
            <Field label="Min. belanja"><Input name="minPurchase" type="number" min="0" defaultValue="0" /></Field>
            <Field label="Kuota"><Input name="quota" type="number" min="0" /></Field>
            <SubmitButton type="submit" className="xl:col-span-6" pendingLabel="Menyimpan voucher...">Simpan Voucher</SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kelola Voucher</CardTitle>
          <CardDescription>Nonaktifkan voucher tanpa menghapus histori order.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_auto]">
            <Input name="q" defaultValue={params.q ?? ""} placeholder="Cari kode atau deskripsi voucher" />
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
                <TableHead>Kode</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Diskon</TableHead>
                <TableHead>Diskon Nominal</TableHead>
                <TableHead>Min. Belanja</TableHead>
                <TableHead>Kuota</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell>
                    <form id={`coupon-${coupon.id}`} action={updateCoupon} className="contents">
                      <input type="hidden" name="id" value={coupon.id} />
                      <Input name="code" defaultValue={coupon.code} className="min-w-36" required />
                    </form>
                  </TableCell>
                  <TableCell><Input form={`coupon-${coupon.id}`} name="description" defaultValue={coupon.description ?? ""} className="min-w-56" /></TableCell>
                  <TableCell><Input form={`coupon-${coupon.id}`} name="discountPercent" type="number" min="0" max="100" defaultValue={coupon.discountPercent ?? 0} className="w-24" /></TableCell>
                  <TableCell><Input form={`coupon-${coupon.id}`} name="discountAmount" type="number" min="0" defaultValue={coupon.discountAmount ?? 0} className="w-32" /></TableCell>
                  <TableCell><Input form={`coupon-${coupon.id}`} name="minPurchase" type="number" min="0" defaultValue={coupon.minPurchase} className="w-32" /></TableCell>
                  <TableCell><Input form={`coupon-${coupon.id}`} name="quota" type="number" min="0" defaultValue={coupon.quota ?? 0} className="w-24" /></TableCell>
                  <TableCell>
                    <select form={`coupon-${coupon.id}`} name="isActive" defaultValue={String(coupon.isActive)} className="h-9 rounded-lg border border-input bg-background px-2 text-sm">
                      <option value="true">Aktif</option>
                      <option value="false">Nonaktif</option>
                    </select>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <SubmitButton form={`coupon-${coupon.id}`} type="submit" size="sm" variant="outline" pendingLabel="Simpan...">Simpan</SubmitButton>
                      <form action={deleteCoupon}>
                        <input type="hidden" name="id" value={coupon.id} />
                        <ConfirmSubmitButton type="submit" size="sm" variant="destructive" pendingLabel="Menghapus..." confirmMessage="Hapus voucher ini? Jika sudah dipakai order, voucher akan dinonaktifkan.">
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
            basePath="/admin/voucher"
            page={page}
            hasNext={coupons.length === pageSize}
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
