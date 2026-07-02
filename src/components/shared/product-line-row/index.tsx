"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { discountPercent, formatPrice, isOnSale } from "@/lib/pricing";
import { QuantityStepper } from "@/components/shared/quantity-stepper";

/**
 * Presentational product line row — shared by the wishlist and the cart.
 * Layout: image on the left; everything else stacks in a single content column
 * (info on top, then the quantity stepper + line subtotal underneath). Stacking —
 * rather than a third horizontal column — is what keeps prices from colliding on
 * narrow screens. Dumb: quantity + remove are driven by callbacks.
 */
export function ProductLineRow({
  href,
  image,
  brand,
  name,
  price,
  compareAt,
  currency = "VND",
  priceFromLabel = false,
  rating,
  badge,
  detail,
  quantity,
  max,
  onDecrease,
  onIncrease,
  onRemove,
  unavailable = false,
  unavailableLabel = "Hết hàng tại chi nhánh đang chọn",
  note,
  showRemaining = false,
  aside,
}: {
  href: string;
  image?: { url?: string; alt?: string };
  brand?: string;
  name: string;
  price: number;
  compareAt?: number | null;
  currency?: string;
  priceFromLabel?: boolean;
  rating?: { average: number; count: number };
  badge?: string;
  detail?: string;
  quantity: number;
  max: number;
  onDecrease: () => void;
  onIncrease: () => void;
  onRemove: () => void;
  unavailable?: boolean;
  unavailableLabel?: string;
  /** Small amber warning under the info (e.g. "Chỉ còn N"). */
  note?: string;
  /** Always show the "Còn N" remaining count (default: only when max ≤ 20). */
  showRemaining?: boolean;
  aside?: ReactNode;
}) {
  const priceObj = { amount: price, compareAt, currency };
  const sale = isOnSale(priceObj);
  const subtotal = price * quantity;

  return (
    <div className="flex gap-3 py-4 sm:gap-4">
      <Link
        href={href}
        className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted/60 ring-1 ring-border/50 sm:size-24"
      >
        {image?.url && <Image src={image.url} alt={image.alt ?? ""} fill sizes="96px" className="object-cover" />}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {/* Top: info + remove */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {brand && (
              <span className="block truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {brand}
              </span>
            )}
            <Link href={href} className="line-clamp-2 text-sm font-medium leading-snug hover:text-primary">
              {name}
            </Link>

            {(rating || badge) && (
              <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                {rating && (
                  <span className="inline-flex items-center gap-0.5 text-muted-foreground">
                    <span aria-hidden className="text-(--theme-rating,#f59e0b)">★</span>
                    <span className="font-medium text-foreground">{rating.average.toFixed(1)}</span>
                    <span>({rating.count})</span>
                  </span>
                )}
                {badge && (
                  <span className="rounded-full bg-(--theme-success,#059669) px-1.5 py-0.5 font-semibold text-white">
                    {badge}
                  </span>
                )}
              </div>
            )}

            {detail && <p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p>}

            <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              {priceFromLabel && <span className="text-xs text-muted-foreground">Từ</span>}
              <span className={cn("text-sm font-semibold", sale && "text-(--theme-sale-price,inherit)")}>
                {formatPrice(price, currency)}
              </span>
              {sale && (
                <>
                  <span className="text-xs text-muted-foreground line-through">
                    {formatPrice(compareAt!, currency)}
                  </span>
                  <span className="rounded bg-(--theme-discount-badge-bg,var(--destructive)) px-1 text-[10px] font-bold text-(--theme-discount-badge-text,#fff)">
                    -{discountPercent(priceObj)}%
                  </span>
                </>
              )}
            </div>

            {unavailable && (
              <p className="mt-1 text-xs text-(--theme-out-of-stock,var(--destructive))">{unavailableLabel}</p>
            )}
            {!unavailable && note && (
              <p className="mt-1 text-xs font-medium text-(--theme-warning,#b45309)">{note}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onRemove}
            aria-label="Xóa"
            className="-mr-1 shrink-0 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-destructive"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            </svg>
          </button>
        </div>

        {/* Bottom: quantity stepper + line subtotal */}
        {!unavailable && (
          <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <QuantityStepper
              quantity={quantity}
              onDecrease={onDecrease}
              onIncrease={onIncrease}
              decreaseDisabled={quantity <= 1}
              increaseDisabled={quantity >= max}
            />
            <div className="flex flex-col items-end gap-1">
              {(showRemaining || max <= 20) && <StockChip remaining={max} />}
              <span className="text-sm font-bold tracking-tight tabular-nums">
                {formatPrice(subtotal, currency)}
              </span>
            </div>
          </div>
        )}

        {aside}
      </div>
    </div>
  );
}

/**
 * Remaining-stock chip with a colour-coded status dot so availability reads at a
 * glance: green = plenty, amber = running low (≤ 5). Renders nothing when there's
 * nothing left to add (the "maxed in cart" note covers that case instead).
 */
function StockChip({ remaining }: { remaining: number }) {
  if (remaining <= 0) return null;
  const low = remaining <= 5;

  const tone = low
    ? "bg-(--theme-warning,#d97706)/12 text-(--theme-warning,#b45309)"
    : "bg-(--theme-in-stock,#16a34a)/12 text-(--theme-in-stock,#15803d)";
  const dot = low ? "bg-(--theme-warning,#d97706)" : "bg-(--theme-in-stock,#16a34a)";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        tone,
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", dot)} />
      {low ? `Sắp hết · còn ${remaining}` : `Còn ${remaining}`}
    </span>
  );
}
