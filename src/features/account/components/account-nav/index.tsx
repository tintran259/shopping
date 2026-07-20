"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

// ── helpers ──────────────────────────────────────────────────────────────────

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

function Ico({ d }: { d: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

// ── nav data ─────────────────────────────────────────────────────────────────

type NavItem = {
  label: string;
  href: string;
  iconD: string;
  soon?: boolean;
  /** Only active on exact pathname with no extra query params */
  exact?: boolean;
};

type Section = { title?: string; items: NavItem[] };

const SECTIONS: Section[] = [
  {
    items: [
      {
        label: "Tổng quan",
        href: "/account",
        exact: true,
        iconD: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
      },
    ],
  },
  {
    title: "Đơn hàng",
    items: [
      {
        label: "Tất cả đơn hàng",
        href: "/account/orders",
        iconD: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0",
      },
      {
        label: "Chờ xác nhận",
        href: "/account/orders?status=pending",
        iconD: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2",
      },
      {
        label: "Chờ lấy hàng",
        href: "/account/orders?status=confirmed",
        iconD: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96 12 12.01l8.73-5.05M12 22.08V12",
      },
      {
        label: "Đang giao",
        href: "/account/orders?status=shipped",
        iconD: "M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
      },
      {
        label: "Đã giao",
        href: "/account/orders?status=delivered",
        iconD: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
      },
      {
        label: "Đã hủy",
        href: "/account/orders?status=cancelled",
        iconD: "M18 6 6 18M6 6l12 12",
      },
      {
        label: "Đổi trả / Hoàn tiền",
        href: "/account/orders/returns",
        iconD: "M3 2v6h6M21 12A9 9 0 0 0 6 5.3L3 8m18 14v-6h-6M3 12a9 9 0 0 0 15 6.7l3-2.7",
        soon: true,
      },
    ],
  },
  {
    title: "Tài khoản",
    items: [
      {
        label: "Thông tin cá nhân",
        href: "/account/profile",
        iconD: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
      },
      {
        label: "Số địa chỉ",
        href: "/account/addresses",
        iconD: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0ZM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
      },
      {
        label: "Phương thức thanh toán",
        href: "/account/payment-methods",
        iconD: "M1 4h22v16H1zM1 10h22",
        soon: true,
      },
      {
        label: "Mã giảm giá của tôi",
        href: "/account/vouchers",
        iconD: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4",
        soon: true,
      },
      {
        label: "Sản phẩm yêu thích",
        href: "/wishlist",
        iconD: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
      },
      {
        label: "Đánh giá của tôi",
        href: "/account/reviews",
        iconD: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
        soon: true,
      },
      {
        label: "Cài đặt tài khoản",
        href: "/account/settings",
        iconD: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
        soon: true,
      },
    ],
  },
];

// ── Inner nav (needs useSearchParams → must be inside Suspense) ───────────────

function NavInner({ onLogout }: { onLogout: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const isActive = (item: NavItem) => {
    const [itemPath, itemQuery] = item.href.split("?");

    // Exact: only active when path matches AND no status param in URL
    if (item.exact) return pathname === itemPath;

    // Path must start with nav item's path
    if (!pathname.startsWith(itemPath)) return false;

    if (itemQuery) {
      // Nav item has query params — all must match current URL
      const itemParams = new URLSearchParams(itemQuery);
      for (const [key, value] of itemParams) {
        if (searchParams.get(key) !== value) return false;
      }
      return true;
    }

    // No query in nav item — "Tất cả đơn hàng" only active on /account/orders with no status filter
    if (itemPath === "/account/orders") {
      return pathname === "/account/orders" && !searchParams.get("status");
    }

    return pathname === itemPath;
  };

  const itemCls = (active: boolean) =>
    cn(
      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
      active
        ? "bg-primary/10 font-semibold text-primary"
        : "font-medium text-foreground hover:bg-muted",
    );

  return (
    <nav className="overflow-hidden rounded-2xl border border-border bg-(--theme-card-background,var(--card))">
      {/* User header */}
      {user && (
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
            {initialsOf(user.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email ?? user.phone}</p>
          </div>
          <Link
            href="/account/profile"
            aria-label="Chỉnh sửa hồ sơ"
            className="shrink-0 text-muted-foreground transition hover:text-foreground"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </Link>
        </div>
      )}

      {/* Sections */}
      <div className="p-2">
        {SECTIONS.map((section, si) => (
          <div key={si} className={si > 0 ? "mt-3" : ""}>
            {section.title && (
              <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item);
                const inner = (
                  <>
                    <span className={cn("shrink-0", active ? "text-primary" : "text-muted-foreground")}>
                      <Ico d={item.iconD} />
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.soon && (
                      <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        Sắp có
                      </span>
                    )}
                  </>
                );
                return (
                  <li key={item.href + item.label}>
                    {active ? (
                      <span className={itemCls(true)} aria-current="page">
                        {inner}
                      </span>
                    ) : (
                      <Link href={item.href} className={itemCls(false)}>
                        {inner}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {/* Logout */}
        <div className="mt-3 border-t border-border/60 pt-2">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

// ── Public export — wraps in Suspense (required by useSearchParams) ────────────

export function AccountNav({ onLogout }: { onLogout: () => void }) {
  return (
    <Suspense
      fallback={
        <div className="h-120 animate-pulse rounded-2xl bg-muted" />
      }
    >
      <NavInner onLogout={onLogout} />
    </Suspense>
  );
}
