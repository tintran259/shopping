"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/pricing";
import { useAuth } from "@/hooks/use-auth";
import { useAddresses } from "@/hooks/use-addresses";
import { isLoggingOut, logoutAndReset } from "@/lib/session";
import { useWishlistStore } from "@/store/wishlist.store";
import { useAuthStore } from "@/store/auth.store";
import { fetchMyOrders } from "@/services/order.service";
import { AccountNav } from "./components/account-nav";

// ── Status badge ─────────────────────────────────────────────────────────────

const DONE = new Set(["delivered", "cancelled"]);

function StatusBadge({ code, label }: { code?: string; label: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        DONE.has(code ?? "")
          ? "bg-muted text-muted-foreground"
          : "bg-(--theme-success,#059669) text-white",
      )}
    >
      {label}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  href,
  iconBg,
  icon,
}: {
  label: string;
  value: number | string;
  href: string;
  iconBg: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-(--theme-card-background,var(--card)) p-4 transition hover:shadow-sm"
    >
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-2xl font-bold tabular-nums">{value}</p>
      </div>
      <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl", iconBg)}>
        {icon}
      </div>
    </Link>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AccountHubPage() {
  const router = useRouter();
  const { isAuthenticated, mounted } = useAuth();
  const token = useAuthStore((s) => s.token);
  const { addresses } = useAddresses();
  const wishlistCount = useWishlistStore((s) =>
    s.lists.reduce((sum, l) => sum + l.items.length, 0),
  );

  useEffect(() => {
    if (mounted && !isAuthenticated && !isLoggingOut()) {
      router.replace("/login?returnTo=/account");
    }
  }, [mounted, isAuthenticated, router]);

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => fetchMyOrders(token as string),
    enabled: !!token,
    staleTime: Infinity,
  });
  const orders = ordersData?.orders ?? [];
  const recentOrders = orders.slice(0, 4);

  if (!mounted || !isAuthenticated) {
    return <div className="h-72 w-full animate-pulse rounded-2xl bg-muted" />;
  }

  return (
    <div className="w-full">
      {/* ── Mobile: nav (already includes user header) ── */}
      <div className="lg:hidden">
        <AccountNav onLogout={logoutAndReset} />
      </div>

      {/* ── Desktop: sidebar + dashboard ── */}
      <div className="hidden lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-6">
        {/* Sidebar */}
        <div className="sticky top-24">
          <AccountNav onLogout={logoutAndReset} />
        </div>

        {/* Dashboard content */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard
              label="Đơn hàng của tôi"
              value={ordersLoading ? "—" : orders.length}
              href="/account/orders"
              iconBg="bg-orange-100 dark:bg-orange-900/30"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500" aria-hidden>
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
                </svg>
              }
            />
            <StatCard
              label="Địa chỉ của tôi"
              value={addresses.length}
              href="/account/addresses"
              iconBg="bg-green-100 dark:bg-green-900/30"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-green-500" aria-hidden>
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0ZM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                </svg>
              }
            />
            <StatCard
              label="Mã giảm giá"
              value={0}
              href="/account/vouchers"
              iconBg="bg-purple-100 dark:bg-purple-900/30"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500" aria-hidden>
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4" />
                </svg>
              }
            />
            <StatCard
              label="Sản phẩm yêu thích"
              value={wishlistCount}
              href="/wishlist"
              iconBg="bg-pink-100 dark:bg-pink-900/30"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500" aria-hidden>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              }
            />
          </div>

          {/* Orders + Addresses */}
          <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
            {/* Recent orders */}
            <div className="rounded-2xl border border-border bg-(--theme-card-background,var(--card)) p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Đơn hàng gần đây</h2>
                <Link href="/account/orders" className="flex items-center gap-0.5 text-sm text-primary hover:underline">
                  Xem tất cả đơn hàng
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </Link>
              </div>

              {ordersLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
                  ))}
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-muted-foreground">Chưa có đơn hàng nào.</p>
                  <Link href="/c/dac-san" className="mt-2 inline-block text-sm text-primary hover:underline">
                    Mua sắm ngay
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {recentOrders.map((o) => {
                    return (
                      <li key={o.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                        {/* Stacked thumbnails */}
                        {(() => {
                          const imgItems = o.items.filter((it) => it.image?.url);
                          const visible = imgItems.slice(0, 3);
                          const extra = o.items.length - 3;
                          const fanRots: Record<number, number[]> = { 1: [0], 2: [-10, 8], 3: [-15, -2, 11] };
                          const rots = fanRots[visible.length] ?? fanRots[3];
                          return imgItems.length === 0 ? (
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground" aria-hidden>
                                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18" />
                              </svg>
                            </div>
                          ) : (
                            <div className="flex shrink-0 items-center gap-1.5">
                              <div className="relative h-10 w-12 shrink-0">
                                {visible.map((it, i) => (
                                  <img
                                    key={i}
                                    src={it.image!.url!}
                                    alt=""
                                    className="absolute bottom-0 size-10 rounded-xl border-2 border-background object-cover shadow-sm"
                                    style={{
                                      left: "50%",
                                      transform: `translateX(-50%) rotate(${rots![i]}deg)`,
                                      transformOrigin: "bottom center",
                                      zIndex: i + 1,
                                    }}
                                  />
                                ))}
                              </div>
                              {extra > 0 && (
                                <div className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-semibold text-muted-foreground">
                                  +{extra}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold">{o.id}</span>
                            <StatusBadge code={o.statusCode} label={o.status} />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(o.createdAt).toLocaleDateString("vi-VN")}
                            {" · "}
                            {o.items.length} sản phẩm
                          </p>
                        </div>

                        {/* Price + link */}
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold tabular-nums text-(--theme-price,inherit)">
                            {formatPrice(o.total, o.currency)}
                          </p>
                          <Link
                            href="/account/orders"
                            className="text-xs text-primary hover:underline"
                          >
                            Xem chi tiết
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Addresses */}
            <div className="rounded-2xl border border-border bg-(--theme-card-background,var(--card)) p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Địa chỉ của tôi</h2>
                <Link href="/account/addresses" className="flex items-center gap-0.5 text-sm text-primary hover:underline">
                  Quản lý địa chỉ
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </Link>
              </div>

              {addresses.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">Chưa có địa chỉ nào.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {addresses.slice(0, 3).map((a) => (
                    <li key={a.id} className="rounded-xl border border-border/60 bg-muted/30 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-sm font-semibold">{a.label || a.recipientName}</span>
                            {a.isDefault && (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                Mặc định
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">{a.recipientName}</p>
                          <p className="text-xs text-muted-foreground">{a.phone}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                            {[a.street, a.ward, a.province].filter(Boolean).join(", ")}
                          </p>
                        </div>
                        <Link
                          href="/account/addresses"
                          aria-label="Quản lý"
                          className="shrink-0 text-muted-foreground hover:text-foreground"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
                          </svg>
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <Link
                href="/account/addresses"
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-sm text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Thêm địa chỉ mới
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
