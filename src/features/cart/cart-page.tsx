"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ProductLineRow } from "@/components/shared/product-line-row";
import { ProductLineRowSkeleton } from "@/components/shared/product-line-row/skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { VoucherSection } from "@/features/cart/components/voucher";
import { formatPrice } from "@/lib/pricing";
import { useCart } from "@/hooks/use-cart";
import { useLiveBranchStock } from "@/hooks/use-live-branch-stock";
import { useBranchStore } from "@/store/branch.store";
import { useAuthStore } from "@/store/auth.store";
import { useVoucherStore } from "@/store/voucher.store";
import {
  amountToQualify,
  discountFor,
  fetchAvailableVouchers,
} from "@/services/voucher.service";
import type { CartLine } from "@/store/cart.store";

export function CartPage() {
  const { lines, ready, setQuantity, removeLine, removeMany, clear } = useCart();
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const appliedVoucher = useVoucherStore((s) => s.appliedVoucher);
  const customerId = useAuthStore((s) => s.user?.id) ?? undefined;
  const isAuthReady = useAuthStore((s) => s._hasHydrated);

  // Disabled until auth hydrates so we never fire a "guest" fetch that gets immediately
  // superseded by a "logged-in" fetch once the persisted token is restored from localStorage.
  const { data: availableVouchers = [] } = useQuery({
    queryKey: ["vouchers", customerId ?? null],
    queryFn: () => fetchAvailableVouchers(customerId),
    staleTime: 5 * 60_000,
    enabled: isAuthReady,
  });

  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmRemoveOos, setConfirmRemoveOos] = useState(false);

  // Verify against LIVE stock (the cart line's branchStock is a snapshot).
  const slugs = useMemo(() => [...new Set(lines.map((l) => l.slug))], [lines]);
  const { byVariant: freshByVariant, ready: stockReady } = useLiveBranchStock(slugs);

  // Per-line status: in stock at branch? how many available? does qty exceed it?
  // Computed once per render (the page reads each line's status several times).
  const statByLine = useMemo(() => {
    const m = new Map<string, { inStock: boolean; available: number; exceed: boolean }>();
    for (const line of lines) {
      const stock = (line.variantId && freshByVariant.get(line.variantId)) || line.branchStock;
      const entry = selectedBranchId ? stock?.find((b) => b.branchId === selectedBranchId) : undefined;
      const inStock = !stock || !selectedBranchId ? true : (entry?.inStock ?? false);
      const available = inStock ? (entry?.quantity ?? line.maxStock ?? 99) : 0;
      m.set(line.id, { inStock, available, exceed: inStock && line.quantity > available });
    }
    return m;
  }, [lines, freshByVariant, selectedBranchId]);
  const stat = (line: CartLine) => statByLine.get(line.id)!;

  // Hold the skeleton until LIVE stock is verified too — otherwise the stale
  // snapshot briefly drives OOS/over-limit banners before the fresh data lands.
  if (!ready || !stockReady) {
    return (
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1fr)_320px] lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <ProductLineRowSkeleton rows={3} />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
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

  const oosLines = lines.filter((l) => !stat(l).inStock);
  const exceedLines = lines.filter((l) => stat(l).exceed);
  const okLines = lines.filter((l) => {
    const s = stat(l);
    return s.inStock && !s.exceed;
  });
  const subtotal = okLines.reduce((s, l) => s + l.price * l.quantity, 0);
  const savings = okLines.reduce(
    (s, l) => s + (l.compareAt && l.compareAt > l.price ? (l.compareAt - l.price) * l.quantity : 0),
    0,
  );
  const totalItems = okLines.reduce((s, l) => s + l.quantity, 0);
  const canCheckout = okLines.length === lines.length && lines.length > 0;

  /** Clamp every over-limit line down to what's actually available. */
  const fixExceeded = () => {
    for (const l of exceedLines) setQuantity(l.id, Math.max(1, stat(l).available));
  };
  const currency = lines[0]?.currency ?? "VND";

  // Nearest voucher by minSubtotal gap — only vouchers where subtotal is the ONLY missing
  // condition (branch + products already match) so the hint is actionable.
  const nearest = availableVouchers
    .filter((v) => {
      if (v.guestsOnly && customerId) return false;
      if (v.requiresAuth && !customerId) return false;
      // Branch must already match (or voucher is unrestricted on branch).
      if (v.applicableBranches?.length) {
        if (!selectedBranchId || !v.applicableBranches.some((b) => b.id === selectedBranchId)) return false;
      }
      // Products must already be in cart (or voucher is unrestricted on products).
      if (v.applicableProducts?.length) {
        if (!slugs.length || !v.applicableProducts.some((p) => slugs.includes(p.slug))) return false;
      }
      return amountToQualify(v, subtotal) > 0;
    })
    .reduce<(typeof availableVouchers)[0] | null>(
      (best, v) =>
        !best || amountToQualify(v, subtotal) < amountToQualify(best, subtotal) ? v : best,
      null,
    );

  const voucher = appliedVoucher ?? undefined;
  const voucherCtx = { cartSlugs: slugs, branchId: selectedBranchId ?? undefined, customerId };
  const voucherDiscount = voucher ? discountFor(voucher, subtotal, voucherCtx) : 0;
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

        {exceedLines.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-(--theme-warning,#d97706)/40 bg-(--theme-warning,#d97706)/10 px-4 py-3">
            <p className="text-sm text-(--theme-warning,#b45309)">
              <span className="font-semibold">{exceedLines.length} sản phẩm</span> vượt quá tồn
              kho hiện có — cập nhật số lượng để tiếp tục.
            </p>
            <Button size="sm" onClick={fixExceeded}>
              Cập nhật số lượng
            </Button>
          </div>
        )}

        <div className="divide-y divide-border/60 rounded-2xl border border-border/60 px-4">
          {lines.map((l) => {
            const { inStock, available, exceed } = stat(l);
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
                max={exceed ? l.quantity : available}
                onDecrease={() => setQuantity(l.id, l.quantity - 1)}
                onIncrease={() => setQuantity(l.id, Math.min(l.quantity + 1, available))}
                onRemove={() => removeLine(l.id)}
                unavailable={!inStock}
                showRemaining
                note={exceed ? `Chỉ còn ${available} — hãy giảm số lượng` : undefined}
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
          <VoucherSection
            subtotal={subtotal}
            currency={currency}
            cartSlugs={slugs}
          />
        </div>

        {subtotal > 0 && nearest && (
          <p className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            Mua thêm{" "}
            <span className="font-semibold text-foreground">
              {formatPrice(amountToQualify(nearest, subtotal), currency)}
            </span>{" "}
            {nearest.type === "shipping" ? (
              "để được miễn phí vận chuyển."
            ) : (
              <>
                để nhận{" "}
                <span className="font-semibold text-foreground">{nearest.label}</span>.
              </>
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
            {oosLines.length > 0
              ? "Xóa sản phẩm hết hàng để tiếp tục"
              : exceedLines.length > 0
                ? "Cập nhật số lượng để tiếp tục"
                : "Tiến hành thanh toán"}
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
