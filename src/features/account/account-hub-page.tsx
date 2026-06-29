"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { logoutAndReset } from "@/lib/session";
import { AccountNav } from "./components/account-nav";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

/**
 * Account hub (`/account`). Mobile: profile header + a vertical menu list, each item
 * opening its own full sub-page (Shopee-style). Desktop: there's no hub — redirect to
 * the profile section, which renders with the persistent sidebar.
 */
export function AccountHubPage() {
  const router = useRouter();
  const { user, isAuthenticated, isWholesale, mounted } = useAuth();

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated) {
      router.replace("/login");
    } else if (window.matchMedia("(min-width: 1024px)").matches) {
      router.replace("/account/profile");
    }
  }, [mounted, isAuthenticated, router]);

  if (!mounted || !isAuthenticated || !user) {
    return <div className="h-72 w-full animate-pulse rounded-2xl bg-muted" />;
  }

  const onLogout = () => logoutAndReset();

  return (
    // Hidden on desktop (it will have redirected to /account/profile).
    <div className="w-full lg:hidden">
      <header className="flex items-center gap-4 rounded-2xl bg-(--theme-card-background,var(--card)) p-5">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
          {initialsOf(user.name)}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-bold tracking-tight">{user.name}</h1>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                isWholesale ? "bg-(--theme-success,#059669) text-white" : "bg-muted text-muted-foreground",
              )}
            >
              {isWholesale ? "Doanh nghiệp" : "Cá nhân"}
            </span>
          </div>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{user.email ?? user.phone}</p>
        </div>
      </header>

      <div className="mt-4">
        <AccountNav onLogout={onLogout} chevron />
      </div>
    </div>
  );
}
