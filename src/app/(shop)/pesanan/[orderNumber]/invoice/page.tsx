import { redirect } from "next/navigation";

export default async function LegacyInvoicePage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  redirect(`/invoice/${orderNumber}`);
}
