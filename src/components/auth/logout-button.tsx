"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function LogoutButton({ compact = false, callbackUrl = "/" }: { compact?: boolean; callbackUrl?: string }) {
  return (
    <Button type="button" variant="outline" size={compact ? "icon" : "default"} onClick={() => signOut({ callbackUrl })}>
      <LogOut data-icon={compact ? "only" : "inline-start"} />
      {compact ? <span className="sr-only">Logout</span> : "Logout"}
    </Button>
  );
}
