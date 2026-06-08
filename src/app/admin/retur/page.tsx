import Link from "next/link";
import { updateReturnRequest } from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { requireAdmin } from "@/lib/admin";
import { getAdminReturnRequests } from "@/lib/admin-data";
import { formatCurrency } from "@/lib/format";

export default async function AdminReturnsPage() {
  await requireAdmin();
  const returns = await getAdminReturnRequests();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Retur & Refund</CardTitle>
        <CardDescription>
          Admin cek pengajuan retur di halaman ini. Status RECEIVED mengembalikan stok, status REFUNDED mengubah payment menjadi REFUNDED.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Alasan</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="text-right">Tanggapan Admin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {returns.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Link href={`/admin/pesanan/${item.order.orderNumber}`} className="font-medium hover:text-primary">
                    {item.order.orderNumber}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">{item.createdAt.toLocaleString("id-ID")}</p>
                </TableCell>
                <TableCell>
                  <p>{item.user?.name ?? item.order.customerName}</p>
                  <p className="text-xs text-muted-foreground">{item.user?.email ?? item.order.customerEmail}</p>
                </TableCell>
                <TableCell><Badge variant="secondary">{item.status}</Badge></TableCell>
                <TableCell className="max-w-72 text-sm text-muted-foreground">{item.reason}</TableCell>
                <TableCell>{formatCurrency(item.order.grandTotal)}</TableCell>
                <TableCell className="text-right">
                  <form action={updateReturnRequest} className="ml-auto grid max-w-sm gap-2">
                    <input type="hidden" name="id" value={item.id} />
                    <select name="status" defaultValue={item.status} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
                      {["REQUESTED", "APPROVED", "REJECTED", "RECEIVED", "REFUNDED", "CANCELLED"].map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                    <Input name="refundAmount" type="number" min="0" defaultValue={item.refundAmount ?? 0} placeholder="Nominal refund" />
                    <Textarea name="adminNote" defaultValue={item.adminNote ?? ""} placeholder="Catatan admin" />
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/pesanan/${item.order.orderNumber}`} className={buttonVariants({ size: "sm", variant: "outline" })}>
                        Detail
                      </Link>
                      <SubmitButton type="submit" size="sm" pendingLabel="Menyimpan...">
                        Simpan
                      </SubmitButton>
                    </div>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!returns.length ? (
          <div className="mt-4 rounded-xl border bg-muted/35 p-6 text-center text-sm text-muted-foreground">
            Belum ada pengajuan retur.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
