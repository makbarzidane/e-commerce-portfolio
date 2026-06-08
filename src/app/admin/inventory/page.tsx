import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/admin";
import { getAdminStockMovements } from "@/lib/admin-data";

export default async function AdminInventoryPage() {
  await requireAdmin();
  const movements = await getAdminStockMovements();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory & Stok</CardTitle>
        <CardDescription>
          Riwayat stok keluar saat checkout, stok kembali dari order bermasalah, dan adjustment stok admin.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Produk</TableHead>
              <TableHead>Varian</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Sebelum</TableHead>
              <TableHead className="text-right">Sesudah</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Catatan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.length ? (
              movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>{new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(movement.createdAt)}</TableCell>
                  <TableCell className="font-medium">{movement.variant.product.name}</TableCell>
                  <TableCell>{movement.variant.color} / {movement.variant.material}</TableCell>
                  <TableCell><Badge variant="secondary">{movement.type}</Badge></TableCell>
                  <TableCell className="text-right">{movement.quantity}</TableCell>
                  <TableCell className="text-right">{movement.stockBefore}</TableCell>
                  <TableCell className="text-right">{movement.stockAfter}</TableCell>
                  <TableCell>{movement.order?.orderNumber ?? "-"}</TableCell>
                  <TableCell className="max-w-64 text-muted-foreground">{movement.note ?? "-"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  Belum ada pergerakan stok.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
