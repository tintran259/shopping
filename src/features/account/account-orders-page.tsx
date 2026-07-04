"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatPrice } from "@/lib/pricing";
import { toast } from "@/store/toast.store";
import { useAuthStore } from "@/store/auth.store";
import { cancelOrder, fetchMyOrders } from "@/services/order.service";
import { OrderDetail } from "@/features/orders/components/order-detail";
import { AccountShell } from "./components/account-shell";

/** Raw BE statuses that read as "done" → neutral badge; everything else is
 *  in-progress. Compared on `statusCode`, not the fulfillment-worded label. */
const DONE = new Set(["delivered", "cancelled"]);

export function AccountOrdersPage() {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  // The order (uuid) pending cancel confirmation.
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => fetchMyOrders(token as string),
    enabled: !!token,
    staleTime: 30_000,
  });
  const orders = data?.orders ?? [];

  const cancelMut = useMutation({
    mutationFn: (uuid: string) => cancelOrder(token as string, uuid),
    onSuccess: () => {
      toast.success("Đã hủy đơn hàng");
      setConfirmCancel(null);
      // Stock was returned + status changed — refresh history and catalog.
      void qc.invalidateQueries({ queryKey: ["my-orders"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
      void qc.invalidateQueries({ queryKey: ["product"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Hủy đơn thất bại"),
  });

  return (
    <AccountShell>
      <h2 className="text-lg font-bold tracking-tight">Đơn hàng của tôi</h2>

      {isLoading ? (
        <div className="mt-5 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-base font-medium">Chưa có đơn hàng nào</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Khám phá sản phẩm và đặt đơn đầu tiên của bạn.
          </p>
          <Link href="/c/dac-san" className={cn(buttonVariants({ size: "sm" }), "mt-3")}>
            Mua sắm ngay
          </Link>
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
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold tabular-nums text-(--theme-price,inherit)">
                      {formatPrice(o.total, o.currency)}
                    </p>
                    <span className="text-xs text-primary">{open ? "Thu gọn" : "Xem chi tiết"}</span>
                  </div>
                </button>

                {open && (
                  <div className="border-t border-border/60 p-4">
                    <OrderDetail
                      order={o}
                      onCancel={o.uuid ? () => setConfirmCancel(o.uuid!) : undefined}
                      cancelling={cancelMut.isPending && confirmCancel === o.uuid}
                    />
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
    </AccountShell>
  );
}
