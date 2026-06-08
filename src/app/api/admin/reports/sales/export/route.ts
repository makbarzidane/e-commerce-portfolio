import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSalesExportFilename, getSalesReport, parseSalesPeriod, salesReportToCsv } from "@/lib/sales-report";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const period = parseSalesPeriod(url.searchParams.get("period"));
  const report = await getSalesReport(period);
  const csv = salesReportToCsv(report);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${getSalesExportFilename(period)}"`,
    },
  });
}
