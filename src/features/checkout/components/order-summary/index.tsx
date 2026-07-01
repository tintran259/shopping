"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { VoucherSection } from "@/features/cart/components/voucher";
import { formatPrice } from "@/lib/pricing";
import type { CartLine } from "@/store/cart.store";

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className={accent ? "text-(--theme-sale-price,var(--destructive))" : "text-muted-foreground"}>
        {label}
      </dt>
      <dd
        className={
          accent
            ? "font-medium tabular-nums text-(--theme-sale-price,var(--destructive))"
            : "font-medium tabular-nums"
        }
      >
        {value}
      </dd>
    </div>
  );
}

export function OrderSummary({
  lines,
  currency,
  subtotal,
  productDiscount,
  shippingFee,
  shippingDiscount,
  total,
  isPickup,
  submitting,
  canPlace,
  invalidHint,
  error,
  onPlace,
}: {
  lines: CartLine[];
  currency: string;
  subtotal: number;
  productDiscount: number;
  shippingFee: number;
  shippingDiscount: number;
  total: number;
  isPickup: boolean;
  submitting: boolean;
  canPlace: boolean;
  invalidHint?: string;
  error?: string | null;
  onPlace: () => void;
}) {
  const priceSavings = lines.reduce(
    (s, l) => s + (l.compareAt && l.compareAt > l.price ? (l.compareAt - l.price) * l.quantity : 0),
    0,
  );
  const totalSaved = priceSavings + productDiscount + shippingDiscount;
  const shipText =
    isPickup || shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee, currency);

  return (
    <aside className="rounded-2xl border border-border bg-(--theme-card-background,var(--card)) p-5 md:sticky md:top-24">
      <h2 className="text-base font-semibold">Đơn hàng ({lines.length} sản phẩm)</h2>

      {/* Items */}
      <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto">
        {lines.map((l) => (
          <li key={l.id} className="flex gap-3">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted/60 ring-1 ring-border/50">
              {l.image?.url && (
                <Image src={l.image.url} alt={l.image.alt ?? ""} fill sizes="48px" className="object-cover" />
              )}
              <span className="absolute -right-1 -top-1 flex min-w-4.5 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-semibold text-background">
                {l.quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-xs font-medium leading-snug">{l.name}</p>
              {l.detail && <p className="truncate text-[11px] text-muted-foreground">{l.detail}</p>}
              <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                {formatPrice(l.price, currency)} × <span className="font-medium text-foreground">{l.quantity}</span>
              </p>
            </div>
            <span className="shrink-0 text-xs font-semibold tabular-nums">
              {formatPrice(l.price * l.quantity, currency)}
            </span>
          </li>
        ))}
      </ul>

      {/* Voucher */}
      <div className="mt-4 border-t border-border pt-4">
        <VoucherSection subtotal={subtotal} currency={currency} />
      </div>

      {/* Totals */}
      <dl className="mt-4 space-y-2.5 border-t border-border pt-4 text-sm">
        <Row label="Tạm tính" value={formatPrice(subtotal, currency)} />
        {productDiscount > 0 && (
          <Row label="Giảm giá (voucher)" value={`−${formatPrice(productDiscount, currency)}`} accent />
        )}
        <Row label="Phí vận chuyển" value={shipText} />
        {shippingDiscount > 0 && (
          <Row label="Giảm phí vận chuyển" value={`−${formatPrice(shippingDiscount, currency)}`} accent />
        )}
      </dl>

      <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
        <span className="text-sm font-medium">Tổng cộng</span>
        <span className="text-xl font-bold tracking-tight tabular-nums text-(--theme-price,inherit)">
          {formatPrice(total, currency)}
        </span>
      </div>

      {totalSaved > 0 && (
        <p className="mt-2 text-right text-xs font-medium text-(--theme-in-stock,#15803d)">
          Bạn đã tiết kiệm {formatPrice(totalSaved, currency)}
        </p>
      )}

      <Button size="lg" className="mt-4 w-full" disabled={!canPlace || submitting} onClick={onPlace}>
        {submitting ? "Đang đặt hàng…" : "Đặt hàng"}
      </Button>
      {error ? (
        <p className="mt-2 text-center text-xs font-medium text-(--theme-out-of-stock,var(--destructive))">
          {error}
        </p>
      ) : (
        !canPlace &&
        invalidHint && (
          <p className="mt-2 text-center text-xs text-(--theme-out-of-stock,var(--destructive))">
            {invalidHint}
          </p>
        )
      )}
    </aside>
  );
}
