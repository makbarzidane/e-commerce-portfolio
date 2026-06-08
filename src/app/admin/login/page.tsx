import { Suspense } from "react";
import { AdminLoginForm } from "@/components/auth/admin-login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminLoginPage() {
  const portfolioDemoMode = !process.env.DATABASE_URL;

  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-md items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Login Admin</CardTitle>
          <CardDescription>Masuk ke panel CMS Zimeira. Pada portfolio mode, gunakan tombol demo untuk mencoba panel tanpa menyimpan perubahan permanen.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={null}>
            <AdminLoginForm portfolioDemoMode={portfolioDemoMode} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
