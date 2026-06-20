"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { logoutAndReset } from "@/lib/session";
import { UserIcon } from "./icons";

export function AccountMenu() {
  const router = useRouter();
  const { user, isAuthenticated, isWholesale, mounted } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Before mount the persisted session isn't known — render a plain link to /account
  // (matches SSR) to avoid a hydration flash.
  if (!mounted) {
    return (
      <Link
        href="/account"
        aria-label="Tài khoản"
        className="inline-flex size-9 items-center justify-center rounded-md hover:bg-muted"
      >
        <UserIcon />
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Tài khoản"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex size-9 items-center justify-center rounded-md hover:bg-muted aria-expanded:bg-muted"
      >
        <UserIcon />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-xl border border-border bg-background shadow-lg">
          {isAuthenticated && user ? (
            <>
              <div className="border-b border-border px-4 py-3">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email ?? user.phone}</p>
                <span
                  className={cn(
                    "mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    isWholesale
                      ? "bg-(--theme-success,#059669) text-white"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {isWholesale ? "Doanh nghiệp" : "Cá nhân"}
                </span>
              </div>
              <nav className="py-1 text-sm">
                <MenuLink href="/account" onClick={() => setOpen(false)}>Tài khoản</MenuLink>
                <MenuLink href="/wishlist" onClick={() => setOpen(false)}>Yêu thích</MenuLink>
                <MenuLink href="/cart" onClick={() => setOpen(false)}>Giỏ hàng</MenuLink>
                <button
                  type="button"
                  onClick={() => {
                    logoutAndReset();
                    setOpen(false);
                    router.push("/");
                  }}
                  className="block w-full px-4 py-2 text-left text-destructive transition hover:bg-muted"
                >
                  Đăng xuất
                </button>
              </nav>
            </>
          ) : (
            <nav className="py-1 text-sm">
              <MenuLink href="/login" onClick={() => setOpen(false)}>Đăng nhập</MenuLink>
              <MenuLink href="/register" onClick={() => setOpen(false)}>Đăng ký</MenuLink>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}

function MenuLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link href={href} onClick={onClick} className="block px-4 py-2 transition hover:bg-muted">
      {children}
    </Link>
  );
}
