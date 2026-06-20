"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { logoutAndReset } from "@/lib/session";
import { AccountNav } from "../account-nav";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

/** Shared account layout: profile header + sidebar nav + section content. Guards
 *  access (redirects guests to /login). Used by every /account/* page. */
export function AccountShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, isWholesale, mounted } = useAuth();

  useEffect(() => {
    if (mounted && !isAuthenticated) router.replace("/login");
  }, [mounted, isAuthenticated, router]);

  if (!mounted || !isAuthenticated || !user) {
    return <div className="h-72 w-full animate-pulse rounded-2xl bg-muted" />;
  }

  const onLogout = () => {
    logoutAndReset();
    router.push("/");
  };

  return (
    <div className="w-full">
      {/* Mobile: back to the hub. Desktop has the sidebar instead. */}
      <Link
        href="/account"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground lg:hidden"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m15 18-6-6 6-6" />
        </svg>
        Tài khoản
      </Link>

      {/* Profile header — desktop only (the hub shows it on mobile). */}
      <header className="hidden flex-wrap items-center gap-4 rounded-2xl bg-(--theme-card-background,var(--card)) p-6 lg:flex">
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

      <div className="lg:mt-5 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-5">
        <div className="hidden lg:block">
          <AccountNav onLogout={onLogout} />
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
