import type { ProductPrice } from "@/types/product";

/**
 * Pricing display helpers — pure formatting/derivation only.
 *
 * The product carries a single source of truth: `amount` (final selling price)
 * and optional `compareAt` (original, strikethrough). The discount % and the
 * saved amount are DERIVED here, never stored, so they can't drift. Real pricing
 * rules (coupons, tiers, per-branch) belong to the BE, not the product schema.
 */

const VND = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

/** "240000" → "240.000 ₫" (defaults to VND; other currencies fall back to code). */
export function formatPrice(amount: number, currency = "VND"): string {
  if (currency === "VND") return VND.format(amount);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
  }).format(amount);
}

export function isOnSale(price: ProductPrice): boolean {
  return price.compareAt != null && price.compareAt > price.amount;
}

/** Rounded percent off, e.g. 20 for 300k → 240k. 0 when not on sale. */
export function discountPercent(price: ProductPrice): number {
  if (!isOnSale(price)) return 0;
  return Math.round(((price.compareAt! - price.amount) / price.compareAt!) * 100);
}

/** Absolute amount saved, 0 when not on sale. */
export function discountAmount(price: ProductPrice): number {
  return isOnSale(price) ? price.compareAt! - price.amount : 0;
}
