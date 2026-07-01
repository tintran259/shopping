"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/pricing";
import type { OrderRecord } from "@/store/order.store";

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={strong ? "font-bold tabular-nums" : "font-medium tabular-nums"}>{value}</dd>
    </div>
  );
}

export function OrderDetail({
  order,
  onCancel,
  cancelling = false,
}: {
  order: OrderRecord;
  /** When provided (and the order is cancellable), shows a "Hủy đơn hàng" action. */
  onCancel?: () => void;
  cancelling?: boolean;
}) {
  const c = order.currency;
  const date = new Date(order.createdAt).toLocaleString("vi-VN");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-(--theme-card-background,var(--card)) p-5">
        <div>
          <p className="text-sm text-muted-foreground">Mã đơn hàng</p>
          <p className="text-lg font-bold tracking-tight">{order.id}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Đặt lúc {date}</p>
        </div>
        <span className="rounded-full bg-(--theme-info,#2563eb)/10 px-3 py-1 text-xs font-semibold text-(--theme-info,#2563eb)">
          {order.status}
        </span>
      </div>

      <section className="rounded-2xl border border-border bg-(--theme-card-background,var(--card)) p-5">
        <h2 className="text-base font-semibold">Thông tin nhận hàng</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <Row label="Người nhận" value={`${order.recipientName} · ${order.phone}`} />
          <Row label="Hình thức" value={order.fulfillment === "pickup" ? "Nhận tại chi nhánh" : "Giao tận nơi"} />
          {order.branchName && <Row label="Chi nhánh" value={order.branchName} />}
          {order.address && <Row label="Địa chỉ" value={order.address} />}
          <Row label="Thanh toán" value={order.paymentLabel} />
        </dl>
      </section>

      <section className="rounded-2xl border border-border bg-(--theme-card-background,var(--card)) p-5">
        <h2 className="text-base font-semibold">Sản phẩm ({order.items.length})</h2>
        <ul className="mt-3 space-y-3">
          {order.items.map((it) => (
            <li key={it.id} className="flex gap-3">
              <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted/60 ring-1 ring-border/50">
                {it.image?.url && (
                  <Image src={it.image.url} alt={it.image.alt ?? ""} fill sizes="48px" className="object-cover" />
                )}
                <span className="absolute -right-1 -top-1 flex min-w-4.5 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-semibold text-background">
                  {it.quantity}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-xs font-medium leading-snug">{it.name}</p>
                {it.detail && (
                  <p className="truncate text-[11px] text-muted-foreground">{it.detail}</p>
                )}
                <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                  {formatPrice(it.price, c)} × <span className="font-medium text-foreground">{it.quantity}</span>
                </p>
              </div>
              <span className="shrink-0 text-xs font-semibold tabular-nums">
                {formatPrice(it.price * it.quantity, c)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
          <Row label="Tạm tính" value={formatPrice(order.subtotal, c)} />
          {order.discount > 0 && <Row label="Giảm giá" value={`−${formatPrice(order.discount, c)}`} />}
          <Row label="Phí vận chuyển" value={order.shippingFee === 0 ? "Miễn phí" : formatPrice(order.shippingFee, c)} />
          <div className="border-t border-border pt-2">
            <Row label="Tổng cộng" value={formatPrice(order.total, c)} strong />
          </div>
        </dl>
      </section>

      {onCancel && order.cancellable && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-(--theme-out-of-stock,var(--destructive))/30 bg-(--theme-out-of-stock,var(--destructive))/5 p-4">
          <p className="text-sm text-muted-foreground">
            Đơn chưa được giao — bạn có thể hủy nếu đổi ý.
          </p>
          <Button variant="destructive" size="sm" onClick={onCancel} disabled={cancelling}>
            {cancelling ? "Đang hủy…" : "Hủy đơn hàng"}
          </Button>
        </div>
      )}
    </div>
  );
}
