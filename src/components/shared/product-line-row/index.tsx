"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { discountPercent, formatPrice, isOnSale } from "@/lib/pricing";

/**
 * Presentational product line row — shared by the wishlist and (later) the cart.
 * Dumb: quantity + remove are driven by callbacks. Optional detail props (rating,
 * badge, compareAt, detail/meta) flesh out the row; `aside` is an extra slot.
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
  aside?: ReactNode;
}) {
  const priceObj = { amount: price, compareAt, currency };
  const sale = isOnSale(priceObj);
  const subtotal = price * quantity;

  return (
    <div className="flex gap-4 py-4">
      <Link
        href={href}
        className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted/60 ring-1 ring-border/50 sm:size-24"
      >
        {image?.url && <Image src={image.url} alt={image.alt ?? ""} fill sizes="96px" className="object-cover" />}
      </Link>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {brand && (
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {brand}
          </span>
        )}
        <Link href={href} className="line-clamp-2 text-sm font-medium leading-snug hover:text-primary">
          {name}
        </Link>

        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
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

        {detail && <p className="truncate text-xs text-muted-foreground">{detail}</p>}

        <div className="mt-0.5 flex items-baseline gap-2">
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
          <p className="text-xs text-(--theme-out-of-stock,var(--destructive))">{unavailableLabel}</p>
        )}
      </div>

      {/* Right: remove + quantity + subtotal */}
      <div className="flex shrink-0 flex-col items-end justify-between gap-3">
        <button
          type="button"
          onClick={onRemove}
          aria-label="Xóa"
          className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-destructive"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          </svg>
        </button>

        {!unavailable && (
          <div className="flex flex-col items-end gap-1.5">
            <div className="inline-flex h-9 items-center rounded-lg border border-border">
              <button
                type="button"
                onClick={onDecrease}
                disabled={quantity <= 1}
                aria-label="Giảm"
                className="flex h-full w-9 items-center justify-center disabled:opacity-40"
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-medium tabular-nums">{quantity}</span>
              <button
                type="button"
                onClick={onIncrease}
                disabled={quantity >= max}
                aria-label="Tăng"
                className="flex h-full w-9 items-center justify-center disabled:opacity-40"
              >
                +
              </button>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold tracking-tight">{formatPrice(subtotal, currency)}</span>
              {max <= 20 && <span className="ml-2 text-[11px] text-muted-foreground">Còn {max}</span>}
            </div>
            {aside}
          </div>
        )}
      </div>
    </div>
  );
}
