"use client";

import { useAuth } from "@/hooks/use-auth";
import { AccountShell } from "./components/account-shell";
import { AccountDetails } from "./components/account-details";

export function AccountProfilePage() {
  const { user, isWholesale } = useAuth();
  return (
    <AccountShell>{user && <AccountDetails user={user} isWholesale={isWholesale} />}</AccountShell>
  );
}
