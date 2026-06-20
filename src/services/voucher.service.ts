import { formatPrice } from "@/lib/pricing";

/**
 * Voucher = storefront commerce logic (BE-owned in real life). Kept here as pure,
 * client-safe functions + a mock catalog so both the cart and (later) checkout share
 * ONE source of truth for code lookup, eligibility, and discount math.
 *
 * `shipping` vouchers can't be resolved in the cart (no shipping fee yet) → they
 * contribute 0 to the cart total and are finalized at checkout.
 */

export type VoucherType = "percent" | "fixed" | "shipping";

export interface Voucher {
  code: string;
  label: string;
  type: VoucherType;
  /** percent: 0–100 · fixed: VND off subtotal · shipping: VND off shipping. */
  value: number;
  minSubtotal?: number;
  /** Cap for percent vouchers. */
  maxDiscount?: number;
  description: string;
  expiresAt?: string; // ISO
}

const VOUCHERS: Voucher[] = [
  {
    code: "DACSAN10",
    label: "Giảm 10%",
    type: "percent",
    value: 10,
    minSubtotal: 200_000,
    maxDiscount: 30_000,
    description: "Giảm 10% (tối đa 30K) cho đơn từ 200K",
    expiresAt: "2026-12-31T23:59:59+07:00",
  },
  {
    code: "WELCOME15",
    label: "Giảm 15%",
    type: "percent",
    value: 15,
    minSubtotal: 100_000,
    maxDiscount: 50_000,
    description: "Thành viên mới: giảm 15% (tối đa 50K), đơn từ 100K",
  },
  {
    code: "GIAM50K",
    label: "Giảm 50.000₫",
    type: "fixed",
    value: 50_000,
    minSubtotal: 300_000,
    description: "Giảm thẳng 50K cho đơn từ 300K",
  },
  {
    code: "FREESHIP",
    label: "Miễn phí vận chuyển",
    type: "shipping",
    value: 30_000,
    minSubtotal: 150_000,
    description: "Giảm tối đa 30K phí vận chuyển, đơn từ 150K",
  },
];

export function getVouchers(): Voucher[] {
  return VOUCHERS;
}

export function findVoucher(code: string): Voucher | undefined {
  const c = code.trim().toUpperCase();
  return VOUCHERS.find((v) => v.code === c);
}

export interface VoucherCheck {
  ok: boolean;
  reason?: string;
}

export function validateVoucher(v: Voucher, subtotal: number): VoucherCheck {
  if (v.expiresAt && Date.parse(v.expiresAt) < Date.now()) {
    return { ok: false, reason: "Mã đã hết hạn" };
  }
  if (v.minSubtotal && subtotal < v.minSubtotal) {
    return { ok: false, reason: `Đơn tối thiểu ${formatPrice(v.minSubtotal)}` };
  }
  return { ok: true };
}

/** Discount applied to the CART subtotal. Shipping vouchers resolve at checkout → 0 here. */
export function discountFor(v: Voucher, subtotal: number): number {
  if (!validateVoucher(v, subtotal).ok) return 0;
  if (v.type === "percent") {
    return Math.min(Math.round((subtotal * v.value) / 100), v.maxDiscount ?? Infinity);
  }
  if (v.type === "fixed") return Math.min(v.value, subtotal);
  return 0; // shipping → checkout
}

/** Shipping-fee discount for a `shipping` voucher (resolved at checkout). 0 otherwise. */
export function shippingDiscountFor(v: Voucher, subtotal: number, shippingFee: number): number {
  if (v.type !== "shipping") return 0;
  if (!validateVoucher(v, subtotal).ok) return 0;
  return Math.min(v.value, shippingFee);
}

/** Amount still needed to qualify, 0 if already eligible. */
export function amountToQualify(v: Voucher, subtotal: number): number {
  return v.minSubtotal ? Math.max(0, v.minSubtotal - subtotal) : 0;
}
