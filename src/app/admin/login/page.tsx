import { Suspense } from "react";
import { AdminLoginForm } from "@/components/auth/admin-login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminLoginPage() {
  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-md items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Login Admin</CardTitle>
          <CardDescription>Gunakan admin@zimeirahijab.test / password123 setelah seed database.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={null}>
            <AdminLoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
