"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { logoutAndReset } from "@/lib/session";
import { AccountNav } from "./components/account-nav";
import { AccountDetails } from "./components/account-details";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

export function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, isWholesale, mounted } = useAuth();

  useEffect(() => {
    if (mounted && !isAuthenticated) router.replace("/login");
  }, [mounted, isAuthenticated, router]);

  if (!mounted || !isAuthenticated || !user) {
    return <div className="mx-auto h-72 w-full max-w-5xl animate-pulse rounded-2xl bg-muted" />;
  }

  const onLogout = () => {
    logoutAndReset();
    router.push("/");
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* Profile header */}
      <header className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-(--theme-card-background,var(--card)) p-5 sm:p-6">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
          {initialsOf(user.name)}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-bold tracking-tight text-(--theme-heading-color,inherit)">
              {user.name}
            </h1>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                isWholesale ? "bg-(--theme-success,#059669) text-white" : "bg-muted text-muted-foreground",
              )}
            >
              {isWholesale ? "Doanh nghiệp" : "Cá nhân"}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {user.email ?? user.phone}
            {isWholesale && user.companyName ? ` · ${user.companyName}` : ""}
          </p>
        </div>
      </header>

      {/* Dashboard: nav + content */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
        <AccountNav onLogout={onLogout} />
        <AccountDetails user={user} isWholesale={isWholesale} />
      </div>
    </div>
  );
}
