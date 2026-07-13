import { env } from "@/config/env";
import { formatPrice } from "@/lib/pricing";

/**
 * Voucher service — fetches the live list from BE and validates codes server-side.
 * Pure math helpers (`discountFor`, `shippingDiscountFor`, …) are kept local so the
 * cart can recompute the discount estimate in real time as the subtotal changes,
 * without a network round-trip on every qty change.
 */

export type VoucherType = "percent" | "fixed" | "shipping";

export interface VoucherProduct {
  id: string;
  slug: string;
  name: string;
}

export interface VoucherBranch {
  id: string;
  name: string;
}

export interface Voucher {
  code: string;
  type: VoucherType;
  /** percent: 0–100 · fixed: VND off subtotal · shipping: VND off shipping fee. */
  value: number;
  minSubtotal?: number;
  /** Cap for percent vouchers. */
  maxDiscount?: number;
  endsAt?: string; // ISO
  /** Products this voucher is restricted to. Undefined = applies to all products. */
  applicableProducts?: VoucherProduct[];
  /** Branches this voucher is restricted to. Undefined = applies to all branches. */
  applicableBranches?: VoucherBranch[];
  /** Shipping methods this voucher applies to (standard/express). Undefined =
   *  every method. Only meaningful for `shipping` vouchers. */
  applicableShippingMethods?: string[];
  /** True when this voucher requires a logged-in session (`users` or `specific` with customers).
   *  FE can only verify "is there a session?"; exact customer match is always server-side. */
  requiresAuth?: boolean;
  /** True when this voucher is ONLY for guests (no account). Logged-in users must not apply it. */
  guestsOnly?: boolean;
  /** Human-readable summary, e.g. "Giảm 10%". Derived client-side. */
  label: string;
  /** Shorter description for the picker row. Derived client-side. */
  description: string;
}

// ── Display helpers ────────────────────────────────────────────────────────

function voucherLabel(v: Pick<Voucher, "type" | "value">): string {
  if (v.type === "percent") return `Giảm ${v.value}%`;
  if (v.type === "fixed") return `Giảm ${formatPrice(v.value)}`;
  return "Miễn phí vận chuyển";
}

function voucherDescription(v: Omit<Voucher, "label" | "description">): string {
  const min = v.minSubtotal ? ` cho đơn từ ${formatPrice(v.minSubtotal)}` : "";
  if (v.type === "percent") {
    const cap = v.maxDiscount ? ` (tối đa ${formatPrice(v.maxDiscount)})` : "";
    return `Giảm ${v.value}%${cap}${min}`;
  }
  if (v.type === "fixed") return `Giảm ${formatPrice(v.value)}${min}`;
  const val = v.value ? ` tối đa ${formatPrice(v.value)}` : "";
  return `Giảm phí vận chuyển${val}${min}`;
}

// ── API shape (raw from BE) ────────────────────────────────────────────────

interface ApiVoucher {
  code: string;
  type: VoucherType;
  value: number;
  minSubtotal: number;
  maxDiscount?: number;
  endsAt?: string;
  applicableProducts?: VoucherProduct[];
  applicableBranches?: VoucherBranch[];
  applicableShippingMethods?: string[];
  requiresCustomer?: boolean;
  guestsOnly?: boolean;
}

function toVoucher(v: ApiVoucher): Voucher {
  const base = {
    ...v,
    minSubtotal: v.minSubtotal || undefined,
    applicableProducts: v.applicableProducts?.length ? v.applicableProducts : undefined,
    applicableBranches: v.applicableBranches?.length ? v.applicableBranches : undefined,
    applicableShippingMethods: v.applicableShippingMethods?.length
      ? v.applicableShippingMethods
      : undefined,
    requiresAuth: v.requiresCustomer ?? false,
    guestsOnly: v.guestsOnly ?? false,
  };
  return { ...base, label: voucherLabel(v), description: voucherDescription(base) };
}

const API = env.apiUrl;

/** Fetch available vouchers. Pass customerId to include vouchers assigned to that customer. */
export async function fetchAvailableVouchers(customerId?: string): Promise<Voucher[]> {
  const url = customerId
    ? `${API}/vouchers/available?customerId=${encodeURIComponent(customerId)}`
    : `${API}/vouchers/available`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Không tải được danh sách mã giảm giá");
  const data: ApiVoucher[] = await res.json();
  return data.map(toVoucher);
}

/** Check a voucher code server-side (POST /vouchers/check) — verifies usage limits
 *  in addition to all scoping rules. Returns the full Voucher + computed discount.
 *  Throws with the BE's error message on failure. */
export async function applyVoucherCode(
  code: string,
  subtotal: number,
  shippingFee = 0,
  customerId?: string,
  branchId?: string,
  productSlugs?: string[],
): Promise<Voucher & { discount: number }> {
  const body: Record<string, unknown> = {
    code: code.trim().toUpperCase(),
    subtotal,
    shippingFee,
  };
  if (customerId) body.customerId = customerId;
  if (branchId) body.branchId = branchId;
  if (productSlugs?.length) body.productSlugs = productSlugs;

  const res = await fetch(`${API}/vouchers/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = "Mã không hợp lệ hoặc không thể áp dụng";
    try {
      const err = await res.json();
      const raw = Array.isArray(err?.message) ? err.message[0] : err?.message;
      if (raw) msg = String(raw);
    } catch {
      // keep default
    }
    throw new Error(msg);
  }
  const data = (await res.json()) as ApiVoucher & { discount: number };
  return { ...toVoucher(data), discount: data.discount };
}

// ── Pure math + scope helpers (local, no network) ─────────────────────────

/** Find a voucher by code in a given list (case-insensitive, trims whitespace). */
export function findVoucher(code: string, list: Voucher[]): Voucher | undefined {
  const c = code.trim().toUpperCase();
  return list.find((v) => v.code === c);
}

export interface VoucherCheck {
  ok: boolean;
  reason?: string;
}

/** Context the storefront provides for local client-side scope checks. */
export interface VoucherContext {
  /** Slugs of products currently in the cart. */
  cartSlugs?: string[];
  /** Currently selected branch id. */
  branchId?: string;
  /** Logged-in customer id. Required for customer-restricted vouchers (`requiresAuth`).
   *  Fine-grained check (is THIS customer in the allowed list?) is always server-side. */
  customerId?: string;
  /** Chosen home-delivery method (standard/express) — checked against a shipping
   *  voucher's `applicableShippingMethods`. */
  shippingMethod?: string;
}

/**
 * Validate a voucher for local eligibility display.
 * Pass `ctx` to check product / branch scoping on the client side.
 * Customer scoping is enforced server-side only (private list — not exposed to FE).
 */
export function validateVoucher(
  v: Voucher,
  subtotal: number,
  ctx: VoucherContext = {},
): VoucherCheck {
  if (v.endsAt && Date.parse(v.endsAt) < Date.now()) {
    return { ok: false, reason: "Mã đã hết hạn" };
  }
  if (v.minSubtotal && subtotal < v.minSubtotal) {
    return { ok: false, reason: `Đơn tối thiểu ${formatPrice(v.minSubtotal)}` };
  }
  if (v.applicableProducts?.length) {
    if (!ctx.cartSlugs?.length) {
      return { ok: false, reason: "Giỏ hàng không có sản phẩm áp dụng mã này" };
    }
    const slugSet = new Set(ctx.cartSlugs);
    const hasRequired = v.applicableProducts.some((p) => slugSet.has(p.slug));
    if (!hasRequired) {
      const names = v.applicableProducts.map((p) => p.name).join(", ");
      return { ok: false, reason: `Chỉ áp dụng cho sản phẩm: ${names}` };
    }
  }
  if (v.applicableBranches?.length) {
    if (!ctx.branchId) {
      return { ok: false, reason: "Vui lòng chọn chi nhánh để sử dụng mã này" };
    }
    const hasRequired = v.applicableBranches.some((b) => b.id === ctx.branchId);
    if (!hasRequired) {
      const names = v.applicableBranches.map((b) => b.name).join(", ");
      return { ok: false, reason: `Chỉ áp dụng tại chi nhánh: ${names}` };
    }
  }
  // Shipping voucher restricted to specific methods (tiêu chuẩn/nhanh) — only
  // enforced once a method is chosen (fail open before that, matching the BE):
  // the method is unknown when applying the code in the cart.
  if (
    v.type === "shipping" &&
    v.applicableShippingMethods?.length &&
    ctx.shippingMethod &&
    !v.applicableShippingMethods.includes(ctx.shippingMethod)
  ) {
    const names = v.applicableShippingMethods
      .map((m) => (m === "express" ? "Giao nhanh" : "Giao tiêu chuẩn"))
      .join(", ");
    return { ok: false, reason: `Chỉ áp dụng cho phương thức: ${names}` };
  }
  // Guests-only: logged-in users must not apply.
  if (v.guestsOnly && ctx.customerId) {
    return { ok: false, reason: "Chỉ áp dụng cho khách vãng lai (không cần tài khoản)" };
  }
  // Requires login: guests must not apply.
  // Fine-grained customer match (specific scope) is always confirmed server-side.
  if (v.requiresAuth && !ctx.customerId) {
    return { ok: false, reason: "Yêu cầu đăng nhập để sử dụng mã này" };
  }
  return { ok: true };
}

/** Discount applied to the CART subtotal. Shipping vouchers resolve at checkout → 0 here. */
export function discountFor(v: Voucher, subtotal: number, ctx: VoucherContext = {}): number {
  if (!validateVoucher(v, subtotal, ctx).ok) return 0;
  if (v.type === "percent") {
    return Math.min(Math.round((subtotal * v.value) / 100), v.maxDiscount ?? Infinity);
  }
  if (v.type === "fixed") return Math.min(v.value, subtotal);
  return 0; // shipping → checkout
}

/** Shipping-fee discount for a `shipping` voucher (resolved at checkout). 0 otherwise. */
export function shippingDiscountFor(
  v: Voucher,
  subtotal: number,
  shippingFee: number,
  ctx: VoucherContext = {},
): number {
  if (v.type !== "shipping") return 0;
  if (!validateVoucher(v, subtotal, ctx).ok) return 0;
  // value === 0 = miễn phí toàn bộ phí ship (100%); value > 0 = giảm tối đa X đ.
  return v.value === 0 ? shippingFee : Math.min(v.value, shippingFee);
}

/** Amount still needed to qualify, 0 if already eligible. */
export function amountToQualify(v: Voucher, subtotal: number): number {
  return v.minSubtotal ? Math.max(0, v.minSubtotal - subtotal) : 0;
}
