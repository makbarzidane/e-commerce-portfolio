import type { Metadata } from "next";
import { Suspense } from "react";
import { ToastCenter } from "@/components/ui/toast-center";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zimeira Hijab Store",
  description: "Demo custom ecommerce hijab store dengan Next.js, Prisma, dan shadcn/ui.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <Suspense fallback={null}>
          <ToastCenter />
        </Suspense>
      </body>
    </html>
  );
}
