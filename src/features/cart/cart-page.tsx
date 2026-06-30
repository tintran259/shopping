"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ProductLineRow } from "@/components/shared/product-line-row";
import { VoucherSection } from "@/features/cart/components/voucher";
import { formatPrice } from "@/lib/pricing";
import { useCart } from "@/hooks/use-cart";
import { useBranchStore } from "@/store/branch.store";
import { useVoucherStore } from "@/store/voucher.store";
import { discountFor, findVoucher } from "@/services/voucher.service";
import type { CartLine } from "@/store/cart.store";

const FREE_SHIP_THRESHOLD = 500_000;

export function CartPage() {
  const { lines, ready, setQuantity, removeLine, removeMany, clear } = useCart();
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const appliedCode = useVoucherStore((s) => s.appliedCode);

  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmRemoveOos, setConfirmRemoveOos] = useState(false);

  const availOf = (line: CartLine) => {
    const available =
      !line.branchStock || !selectedBranchId
        ? true
        : (line.branchStock.find((b) => b.branchId === selectedBranchId)?.inStock ?? false);
    return { available, max: line.maxStock || 1 };
  };

  if (!ready) {
    return (
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1fr)_320px] lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="size-20 animate-pulse rounded-xl bg-muted sm:size-24" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-8 w-40 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
        <p className="text-base font-medium">Giỏ hàng trống</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Khám phá sản phẩm và thêm vào giỏ để bắt đầu mua sắm.
        </p>
        <Link href="/c/dac-san" className={cn(buttonVariants(), "mt-2")}>
          Khám phá đặc sản
        </Link>
      </div>
    );
  }

  const oosLines = lines.filter((l) => !availOf(l).available);
  const okLines = lines.filter((l) => availOf(l).available);
  const subtotal = okLines.reduce((s, l) => s + l.price * l.quantity, 0);
  const savings = okLines.reduce(
    (s, l) => s + (l.compareAt && l.compareAt > l.price ? (l.compareAt - l.price) * l.quantity : 0),
    0,
  );
  const totalItems = okLines.reduce((s, l) => s + l.quantity, 0);
  const canCheckout = okLines.length > 0 && oosLines.length === 0;
  const freeShipLeft = Math.max(0, FREE_SHIP_THRESHOLD - subtotal);
  const currency = lines[0]?.currency ?? "VND";

  const voucher = appliedCode ? findVoucher(appliedCode) : undefined;
  const voucherDiscount = voucher ? discountFor(voucher, subtotal) : 0;
  const total = Math.max(0, subtotal - voucherDiscount);
  // Informational only — NOT subtracted again (subtotal already uses sale prices).
  const totalSaved = savings + voucherDiscount;

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1fr)_320px] md:items-start lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* Lines */}
      <div className="min-w-0">
        {oosLines.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-(--theme-out-of-stock,var(--destructive))/30 bg-(--theme-out-of-stock,var(--destructive))/5 px-4 py-3">
            <p className="text-sm text-(--theme-out-of-stock,var(--destructive))">
              <span className="font-semibold">{oosLines.length} sản phẩm</span> đã hết hàng tại
              chi nhánh đang chọn — hãy xóa để tiếp tục thanh toán.
            </p>
            <Button variant="destructive" size="sm" onClick={() => setConfirmRemoveOos(true)}>
              Xóa sản phẩm hết hàng
            </Button>
          </div>
        )}

        <div className="divide-y divide-border/60 rounded-2xl border border-border/60 px-4">
          {lines.map((l) => {
            const { available, max } = availOf(l);
            return (
              <ProductLineRow
                key={l.id}
                href={`/product/${l.slug}`}
                image={l.image}
                brand={l.brand}
                name={l.name}
                price={l.price}
                compareAt={l.compareAt}
                currency={l.currency}
                rating={l.rating}
                detail={l.detail}
                quantity={l.quantity}
                max={max}
                onDecrease={() => setQuantity(l.id, l.quantity - 1)}
                onIncrease={() => setQuantity(l.id, l.quantity + 1)}
                onRemove={() => removeLine(l.id)}
                unavailable={!available}
              />
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Link href="/c/dac-san" className="text-sm text-muted-foreground hover:text-foreground">
            ← Tiếp tục mua sắm
          </Link>
          <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)}>
            Xóa tất cả
          </Button>
        </div>
      </div>

      {/* Summary */}
      <aside className="rounded-2xl border border-border bg-(--theme-card-background,var(--card)) p-5 md:sticky md:top-24">
        <h2 className="text-base font-semibold">Tóm tắt đơn hàng</h2>

        <dl className="mt-4 space-y-2.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Tạm tính ({totalItems} sản phẩm)</dt>
            <dd className="font-medium tabular-nums">{formatPrice(subtotal, currency)}</dd>
          </div>
          {voucherDiscount > 0 && (
            <div className="flex justify-between text-(--theme-sale-price,var(--destructive))">
              <dt>Giảm giá (voucher)</dt>
              <dd className="font-medium tabular-nums">−{formatPrice(voucherDiscount, currency)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Phí vận chuyển</dt>
            <dd className="text-muted-foreground">Tính khi thanh toán</dd>
          </div>
        </dl>

        {/* Voucher */}
        <div className="mt-4 border-t border-border pt-4">
          <VoucherSection subtotal={subtotal} currency={currency} />
        </div>

        {subtotal > 0 && (
          <p className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            {freeShipLeft > 0 ? (
              <>
                Mua thêm{" "}
                <span className="font-semibold text-foreground">
                  {formatPrice(freeShipLeft, currency)}
                </span>{" "}
                để được miễn phí vận chuyển.
              </>
            ) : (
              <span className="font-medium text-(--theme-in-stock,#16a34a)">
                Đơn hàng được miễn phí vận chuyển 🎉
              </span>
            )}
          </p>
        )}

        <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
          <div>
            <span className="text-sm font-medium">Tổng cộng</span>
            <p className="text-[11px] text-muted-foreground">Chưa gồm phí vận chuyển</p>
          </div>
          <span className="text-xl font-bold tracking-tight tabular-nums text-(--theme-price,inherit)">
            {formatPrice(total, currency)}
          </span>
        </div>

        {totalSaved > 0 && (
          <div className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-(--theme-in-stock,#16a34a)/10 px-3 py-2 text-xs font-medium text-(--theme-in-stock,#15803d)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M7.5 7.5h.01M3 11V5a2 2 0 0 1 2-2h6l9 9a2 2 0 0 1 0 2.8l-5.2 5.2a2 2 0 0 1-2.8 0Z" />
            </svg>
            Bạn đã tiết kiệm {formatPrice(totalSaved, currency)}
          </div>
        )}

        {canCheckout ? (
          <Link
            href="/checkout"
            className={cn(buttonVariants({ size: "lg" }), "mt-4 w-full")}
          >
            Tiến hành thanh toán
          </Link>
        ) : (
          <Button size="lg" className="mt-4 w-full" disabled>
            {oosLines.length > 0 ? "Xóa sản phẩm hết hàng để tiếp tục" : "Tiến hành thanh toán"}
          </Button>
        )}
      </aside>

      <ConfirmDialog
        open={confirmClear}
        title="Xóa toàn bộ giỏ hàng"
        description="Bạn có thật sự muốn xóa tất cả sản phẩm khỏi giỏ hàng không?"
        confirmLabel="Xóa tất cả"
        danger
        onConfirm={() => {
          clear();
          setConfirmClear(false);
        }}
        onCancel={() => setConfirmClear(false)}
      />

      <ConfirmDialog
        open={confirmRemoveOos}
        title="Xóa sản phẩm hết hàng"
        description={`${oosLines.length} sản phẩm đã hết hàng tại chi nhánh đang chọn sẽ bị xóa khỏi giỏ hàng. Tiếp tục?`}
        confirmLabel="Xóa"
        danger
        onConfirm={() => {
          removeMany(oosLines.map((l) => l.id));
          setConfirmRemoveOos(false);
        }}
        onCancel={() => setConfirmRemoveOos(false)}
      />
    </div>
  );
}
