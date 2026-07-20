"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatPrice } from "@/lib/pricing";
import { toast } from "@/store/toast.store";
import { useAuthStore } from "@/store/auth.store";
import { cancelOrder, fetchMyOrders } from "@/services/order.service";
import type { OrderRecord } from "@/store/order.store";
import { OrderDetail } from "@/features/orders/components/order-detail";
import { OrderFeedback } from "@/features/orders/components/order-feedback";
import { AccountShell } from "./components/account-shell";

const DONE = new Set(["delivered", "cancelled"]);

// statusCode groups per nav filter key
const STATUS_GROUPS: Record<string, string[]> = {
  pending: ["pending"],
  confirmed: ["confirmed", "processing"],
  shipped: ["shipped"],
  delivered: ["delivered"],
  cancelled: ["cancelled"],
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Chờ lấy hàng",
  shipped: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

// ── Thumbnail stack ────────────────────────────────────────────────────────────

const FAN_ROTATIONS: Record<number, number[]> = {
  1: [0],
  2: [-10, 8],
  3: [-15, -2, 11],
};

function OrderThumbs({ order }: { order: OrderRecord }) {
  const imgItems = order.items.filter((it) => it.image?.url);
  const visible = imgItems.slice(0, 3);
  const extra = order.items.length - 3;
  const rots = FAN_ROTATIONS[visible.length] ?? FAN_ROTATIONS[3];

  if (imgItems.length === 0) {
    return (
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground" aria-hidden>
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      {/* Fan container — all cards anchored at bottom-center */}
      <div className="relative h-11 w-14 shrink-0">
        {visible.map((it, i) => (
          <img
            key={i}
            src={it.image!.url!}
            alt=""
            className="absolute bottom-0 size-11 rounded-xl border-2 border-background object-cover shadow-sm"
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
        <div className="flex h-6 min-w-6 items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-semibold text-muted-foreground">
          +{extra}
        </div>
      )}
    </div>
  );
}

// ── Orders list (reads ?status from URL) ──────────────────────────────────────

function OrdersList() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") ?? "";

  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => fetchMyOrders(token as string),
    enabled: !!token,
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  });

  const allOrders = data?.orders ?? [];
  const orders = statusFilter
    ? allOrders.filter((o) =>
        STATUS_GROUPS[statusFilter]?.includes(o.statusCode ?? ""),
      )
    : allOrders;

  const filterLabel = statusFilter ? STATUS_LABEL[statusFilter] : null;

  const cancelMut = useMutation({
    mutationFn: (uuid: string) => cancelOrder(token as string, uuid),
    onSuccess: () => {
      toast.success("Đã hủy đơn hàng");
      setConfirmCancel(null);
      void qc.invalidateQueries({ queryKey: ["my-orders"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
      void qc.invalidateQueries({ queryKey: ["product"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Hủy đơn thất bại"),
  });

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-bold tracking-tight">Đơn hàng của tôi</h2>
        {filterLabel && (
          <span className="rounded-full bg-primary/10 px-3 py-0.5 text-sm font-medium text-primary">
            {filterLabel}
          </span>
        )}
        {filterLabel && (
          <Link
            href="/account/orders"
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            Xem tất cả
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="mt-5 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-base font-medium">
            {filterLabel
              ? `Không có đơn hàng "${filterLabel}"`
              : "Chưa có đơn hàng nào"}
          </p>
          {!filterLabel && (
            <>
              <p className="mt-1 text-sm text-muted-foreground">
                Khám phá sản phẩm và đặt đơn đầu tiên của bạn.
              </p>
              <Link href="/c/dac-san" className={cn(buttonVariants({ size: "sm" }), "mt-3")}>
                Mua sắm ngay
              </Link>
            </>
          )}
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {orders.map((o) => {
            const open = expanded === o.id;
            return (
              <li
                key={o.id}
                className="overflow-hidden rounded-2xl border border-border bg-(--theme-card-background,var(--card))"
              >
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : o.id)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-muted/40"
                >
                  {/* Stacked thumbnails */}
                  <OrderThumbs order={o} />

                  {/* Order info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{o.id}</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          DONE.has(o.statusCode ?? "")
                            ? "bg-muted text-muted-foreground"
                            : "bg-(--theme-success,#059669) text-white",
                        )}
                      >
                        {o.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(o.createdAt).toLocaleString("vi-VN")} · {o.items.length} sản phẩm
                    </p>
                  </div>

                  {/* Price + toggle */}
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold tabular-nums text-(--theme-price,inherit)">
                      {formatPrice(o.total, o.currency)}
                    </p>
                    <span className="text-xs text-primary">
                      {open ? "Thu gọn" : "Xem chi tiết"}
                    </span>
                  </div>
                </button>

                {open && (
                  <div className="space-y-4 border-t border-border/60 p-4">
                    <OrderDetail
                      order={o}
                      onCancel={o.uuid ? () => setConfirmCancel(o.uuid!) : undefined}
                      cancelling={cancelMut.isPending && confirmCancel === o.uuid}
                    />
                    {o.statusCode === "delivered" && <OrderFeedback order={o} />}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={confirmCancel !== null}
        title="Hủy đơn hàng"
        description="Bạn có chắc muốn hủy đơn hàng này? Hành động không thể hoàn tác."
        confirmLabel={cancelMut.isPending ? "Đang hủy…" : "Hủy đơn"}
        cancelLabel="Không"
        danger
        onConfirm={() => confirmCancel && cancelMut.mutate(confirmCancel)}
        onCancel={() => !cancelMut.isPending && setConfirmCancel(null)}
      />
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function AccountOrdersPage() {
  return (
    <AccountShell>
      <Suspense
        fallback={
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        }
      >
        <OrdersList />
      </Suspense>
    </AccountShell>
  );
}
