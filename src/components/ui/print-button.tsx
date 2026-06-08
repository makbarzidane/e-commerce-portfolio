"use client";

import { Button } from "@/components/ui/button";

export function PrintButton({ children = "Cetak / Simpan PDF" }: { children?: React.ReactNode }) {
  return (
    <Button type="button" variant="outline" onClick={() => window.print()} className="print:hidden">
      {children}
    </Button>
  );
}
