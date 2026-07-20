"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { isLoggingOut, logoutAndReset } from "@/lib/session";
import { AccountNav } from "../account-nav";

/** Shared account layout: sticky sidebar nav + section content.
 *  Guards access — redirects guests to /login?returnTo=<current path>. */
export function AccountShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, mounted } = useAuth();

  useEffect(() => {
    if (mounted && !isAuthenticated && !isLoggingOut()) {
      router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [mounted, isAuthenticated, router, pathname]);

  if (!mounted || !isAuthenticated) {
    return <div className="h-72 w-full animate-pulse rounded-2xl bg-muted" />;
  }

  return (
    <div className="w-full">
      {/* Mobile: back to the hub */}
      <Link
        href="/account"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground lg:hidden"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m15 18-6-6 6-6" />
        </svg>
        Tài khoản
      </Link>

      <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-6">
        {/* Sidebar — hidden on mobile (hub page handles that) */}
        <div className="hidden lg:block lg:sticky lg:top-24">
          <AccountNav onLogout={logoutAndReset} />
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
