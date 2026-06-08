import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/admin";
import { getAdminAuditLogs } from "@/lib/admin-data";

export default async function AdminAuditPage() {
  await requireAdmin();
  const logs = await getAdminAuditLogs();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Log Admin</CardTitle>
        <CardDescription>Riwayat 100 aksi admin terbaru untuk produk, varian, order, customer, voucher, banner, dan setting.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Aksi</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Ringkasan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{log.createdAt.toLocaleString("id-ID")}</TableCell>
                <TableCell>{log.actor?.name ?? log.actor?.email ?? "System"}</TableCell>
                <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                <TableCell>{log.entity}</TableCell>
                <TableCell>{log.summary}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!logs.length ? <p className="mt-4 text-sm text-muted-foreground">Belum ada audit log.</p> : null}
      </CardContent>
    </Card>
  );
}
