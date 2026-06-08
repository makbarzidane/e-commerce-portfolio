import { deleteCustomer } from "@/app/admin/actions";
import Link from "next/link";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConfirmSubmitButton, SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/admin";
import { getAdminCustomers } from "@/lib/admin-data";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const pageSize = 20;
  const customers = await getAdminCustomers({ q: params.q, role: params.role, page, pageSize });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kelola Customer</CardTitle>
        <CardDescription>Customer tanpa order bisa dihapus. Customer dengan order tetap disimpan untuk riwayat transaksi.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <Input name="q" defaultValue={params.q ?? ""} placeholder="Cari nama, email, atau telepon" />
          <select name="role" defaultValue={params.role ?? ""} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
            <option value="">Semua role</option>
            <option value="CUSTOMER">Customer</option>
            <option value="ADMIN">Admin</option>
          </select>
          <SubmitButton type="submit" variant="outline" pendingLabel="Filter...">Filter</SubmitButton>
        </form>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telepon</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Total Order</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => {
              const canDelete = customer.role === "CUSTOMER" && customer._count.orders === 0;

              return (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name ?? "-"}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone ?? "-"}</TableCell>
                  <TableCell><Badge variant="secondary">{customer.role}</Badge></TableCell>
                  <TableCell>{customer._count.orders}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/customer/${customer.id}`} className={buttonVariants({ size: "sm", variant: "outline" })}>
                        Detail
                      </Link>
                      <form action={deleteCustomer}>
                        <input type="hidden" name="id" value={customer.id} />
                        <ConfirmSubmitButton type="submit" size="sm" variant="destructive" disabled={!canDelete} pendingLabel="Menghapus..." confirmMessage="Hapus customer ini secara permanen? Customer dengan riwayat order tetap tidak akan dihapus oleh sistem.">
                          Hapus
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <PaginationControls
          basePath="/admin/customer"
          page={page}
          hasNext={customers.length === pageSize}
          params={{ q: params.q, role: params.role }}
        />
      </CardContent>
    </Card>
  );
}
