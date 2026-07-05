import { describe, it, expect } from "vitest";
import {
  findVoucher,
  validateVoucher,
  discountFor,
  shippingDiscountFor,
  amountToQualify,
  type Voucher,
} from "./voucher.service";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const percent: Voucher = {
  code: "P10",
  label: "Giảm 10%",
  type: "percent",
  value: 10,
  minSubtotal: 200_000,
  maxDiscount: 30_000,
  description: "Giảm 10% tối đa 30K cho đơn từ 200K",
};

const fixed: Voucher = {
  code: "F50",
  label: "Giảm 50K",
  type: "fixed",
  value: 50_000,
  minSubtotal: 300_000,
  description: "Giảm 50K cho đơn từ 300K",
};

const ship: Voucher = {
  code: "SHIP",
  label: "Miễn phí vận chuyển",
  type: "shipping",
  value: 30_000,
  minSubtotal: 150_000,
  description: "Giảm tối đa 30K phí ship cho đơn từ 150K",
};

const expired: Voucher = {
  code: "OLD",
  label: "Hết hạn",
  type: "fixed",
  value: 10_000,
  description: "",
  endsAt: "2020-01-01T00:00:00+07:00",
};

const productVoucher: Voucher = {
  code: "COMBO",
  label: "Combo sản phẩm",
  type: "percent",
  value: 20,
  description: "Giảm 20% combo A, B",
  applicableProducts: [
    { id: "1", slug: "san-pham-a", name: "Sản phẩm A" },
    { id: "2", slug: "san-pham-b", name: "Sản phẩm B" },
  ],
};

const branchVoucher: Voucher = {
  code: "Q1",
  label: "Chi nhánh Q1",
  type: "fixed",
  value: 50_000,
  description: "Chỉ áp dụng tại Chi nhánh Q1",
  applicableBranches: [{ id: "branch-q1", name: "Chi nhánh Q1" }],
};

const comboVoucher: Voucher = {
  code: "FULL",
  label: "Combo + Chi nhánh",
  type: "fixed",
  value: 100_000,
  description: "Sản phẩm A + Chi nhánh Q1",
  applicableProducts: [{ id: "1", slug: "san-pham-a", name: "Sản phẩm A" }],
  applicableBranches: [{ id: "branch-q1", name: "Chi nhánh Q1" }],
};

const customerVoucher: Voucher = {
  code: "VIP",
  label: "Khách VIP",
  type: "fixed",
  value: 100_000,
  description: "Chỉ dành cho khách hàng được chỉ định",
  requiresAuth: true,
};

const guestVoucher: Voucher = {
  code: "GUEST10",
  label: "Khách vãng lai",
  type: "percent",
  value: 10,
  description: "Chỉ dành cho khách vãng lai",
  guestsOnly: true,
};

const list = [percent, fixed, ship, expired];

// ── findVoucher ───────────────────────────────────────────────────────────────

describe("findVoucher", () => {
  it("is case-insensitive and trims whitespace", () => {
    expect(findVoucher(" p10 ", list)?.code).toBe("P10");
  });
  it("returns undefined for unknown codes", () => {
    expect(findVoucher("NOPE", list)).toBeUndefined();
  });
  it("finds by exact match after normalisation", () => {
    expect(findVoucher("SHIP", list)?.type).toBe("shipping");
  });
});

// ── validateVoucher — basic ────────────────────────────────────────────────────

describe("validateVoucher — basic", () => {
  it("rejects when subtotal is below minimum", () => {
    const r = validateVoucher(percent, 150_000);
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("tối thiểu");
  });
  it("accepts at the exact minimum subtotal", () => {
    expect(validateVoucher(percent, 200_000).ok).toBe(true);
  });
  it("accepts above minimum subtotal", () => {
    expect(validateVoucher(percent, 500_000).ok).toBe(true);
  });
  it("rejects expired vouchers regardless of subtotal", () => {
    expect(validateVoucher(expired, 999_000).ok).toBe(false);
  });
  it("accepts vouchers without minSubtotal at any amount", () => {
    expect(validateVoucher(productVoucher, 0).ok).toBe(true);
  });
});

// ── validateVoucher — product scope ───────────────────────────────────────────

describe("validateVoucher — product scope (ctx.cartSlugs)", () => {
  it("passes when cart contains at least one applicable product", () => {
    const r = validateVoucher(productVoucher, 0, { cartSlugs: ["san-pham-a", "san-pham-x"] });
    expect(r.ok).toBe(true);
  });
  it("fails when no cart product matches", () => {
    const r = validateVoucher(productVoucher, 0, { cartSlugs: ["san-pham-x", "san-pham-y"] });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("Sản phẩm A");
    expect(r.reason).toContain("Sản phẩm B");
  });
  it("fails with empty cart slugs", () => {
    const r = validateVoucher(productVoucher, 0, { cartSlugs: [] });
    expect(r.ok).toBe(false);
  });
  it("skips product check when cartSlugs is not provided", () => {
    // undefined context → no scope check → eligible (ignoring other conditions)
    expect(validateVoucher(productVoucher, 0).ok).toBe(true);
  });
  it("passes any product when voucher has no product restriction", () => {
    expect(validateVoucher(percent, 200_000, { cartSlugs: ["random-slug"] }).ok).toBe(true);
  });
});

// ── validateVoucher — branch scope ───────────────────────────────────────────

describe("validateVoucher — branch scope (ctx.branchId)", () => {
  it("passes when branchId matches an applicable branch", () => {
    expect(validateVoucher(branchVoucher, 0, { branchId: "branch-q1" }).ok).toBe(true);
  });
  it("fails with a reason when branchId is not in applicableBranches", () => {
    const r = validateVoucher(branchVoucher, 0, { branchId: "branch-q3" });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("Chi nhánh Q1");
  });
  it("skips branch check when branchId is not provided", () => {
    expect(validateVoucher(branchVoucher, 0).ok).toBe(true);
  });
  it("passes any branch when voucher has no branch restriction", () => {
    expect(validateVoucher(percent, 200_000, { branchId: "any-branch" }).ok).toBe(true);
  });
});

// ── validateVoucher — combined scopes ─────────────────────────────────────────

describe("validateVoucher — combined product + branch scope", () => {
  it("passes when both product and branch match", () => {
    const r = validateVoucher(comboVoucher, 0, {
      cartSlugs: ["san-pham-a"],
      branchId: "branch-q1",
    });
    expect(r.ok).toBe(true);
  });
  it("fails on product mismatch even if branch matches", () => {
    const r = validateVoucher(comboVoucher, 0, {
      cartSlugs: ["other"],
      branchId: "branch-q1",
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("Sản phẩm A");
  });
  it("fails on branch mismatch even if product matches", () => {
    const r = validateVoucher(comboVoucher, 0, {
      cartSlugs: ["san-pham-a"],
      branchId: "branch-q3",
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("Chi nhánh Q1");
  });
});

// ── validateVoucher — customer scope ─────────────────────────────────────────

describe("validateVoucher — customer scope (ctx.customerId)", () => {
  it("rejects when requiresAuth and no context provided (guest)", () => {
    const r = validateVoucher(customerVoucher, 0);
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("đăng nhập");
  });
  it("rejects when requiresAuth and customerId is undefined", () => {
    expect(validateVoucher(customerVoucher, 0, { customerId: undefined }).ok).toBe(false);
  });
  it("passes when requiresAuth and customerId is provided", () => {
    expect(validateVoucher(customerVoucher, 0, { customerId: "cust-abc" }).ok).toBe(true);
  });
  it("public vouchers pass without customerId", () => {
    expect(validateVoucher(percent, 200_000).ok).toBe(true);
  });
  it("public vouchers pass with customerId (no interference)", () => {
    expect(validateVoucher(percent, 200_000, { customerId: "cust-abc" }).ok).toBe(true);
  });
});

// ── validateVoucher — guests-only scope ──────────────────────────────────────

describe("validateVoucher — guests-only scope (ctx.customerId)", () => {
  it("passes for guest (no customerId)", () => {
    expect(validateVoucher(guestVoucher, 0).ok).toBe(true);
  });
  it("passes when ctx.customerId is undefined", () => {
    expect(validateVoucher(guestVoucher, 0, { customerId: undefined }).ok).toBe(true);
  });
  it("rejects when logged-in user tries to apply", () => {
    const r = validateVoucher(guestVoucher, 0, { customerId: "cust-abc" });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("khách vãng lai");
  });
  it("non-guestsOnly vouchers are unaffected by customerId presence", () => {
    expect(validateVoucher(percent, 200_000, { customerId: "cust-abc" }).ok).toBe(true);
  });
});

// ── discountFor ───────────────────────────────────────────────────────────────

describe("discountFor", () => {
  it("applies percent discount", () => {
    expect(discountFor(percent, 200_000)).toBe(20_000);
  });
  it("caps percent discount at maxDiscount", () => {
    expect(discountFor(percent, 1_000_000)).toBe(30_000);
  });
  it("applies fixed amount", () => {
    expect(discountFor(fixed, 300_000)).toBe(50_000);
  });
  it("never discounts more than the subtotal for fixed", () => {
    const tiny: Voucher = { code: "X", label: "", type: "fixed", value: 100_000, description: "" };
    expect(discountFor(tiny, 30_000)).toBe(30_000);
  });
  it("returns 0 for shipping vouchers (resolved at checkout)", () => {
    expect(discountFor(ship, 200_000)).toBe(0);
  });
  it("returns 0 when below minimum subtotal", () => {
    expect(discountFor(percent, 100_000)).toBe(0);
  });
  it("returns 0 when product scope fails", () => {
    expect(discountFor(productVoucher, 500_000, { cartSlugs: ["other"] })).toBe(0);
  });
  it("computes correctly when product scope passes", () => {
    // productVoucher: 20%, no cap, no minSubtotal
    expect(discountFor(productVoucher, 500_000, { cartSlugs: ["san-pham-a"] })).toBe(100_000);
  });
  it("returns 0 when branch scope fails", () => {
    expect(discountFor(branchVoucher, 500_000, { branchId: "other-branch" })).toBe(0);
  });
});

// ── shippingDiscountFor ───────────────────────────────────────────────────────

describe("shippingDiscountFor", () => {
  it("discounts shipping up to the voucher value", () => {
    expect(shippingDiscountFor(ship, 200_000, 30_000)).toBe(30_000);
  });
  it("is capped at the actual shipping fee", () => {
    expect(shippingDiscountFor(ship, 200_000, 18_000)).toBe(18_000);
  });
  it("returns 0 for non-shipping vouchers", () => {
    expect(shippingDiscountFor(percent, 200_000, 30_000)).toBe(0);
  });
  it("returns 0 when subtotal is below minimum", () => {
    expect(shippingDiscountFor(ship, 100_000, 30_000)).toBe(0);
  });
  it("returns 0 for pickup orders (fee = 0)", () => {
    expect(shippingDiscountFor(ship, 200_000, 0)).toBe(0);
  });
  it("respects ctx — returns 0 when branch scope fails", () => {
    const shipBranch: Voucher = {
      ...ship,
      code: "SHIPBRANCH",
      applicableBranches: [{ id: "b1", name: "Q1" }],
    };
    expect(shippingDiscountFor(shipBranch, 200_000, 30_000, { branchId: "other" })).toBe(0);
    expect(shippingDiscountFor(shipBranch, 200_000, 30_000, { branchId: "b1" })).toBe(30_000);
  });
});

// ── amountToQualify ───────────────────────────────────────────────────────────

describe("amountToQualify", () => {
  it("returns the gap to the minimum when subtotal is below", () => {
    expect(amountToQualify(percent, 150_000)).toBe(50_000);
  });
  it("returns 0 when subtotal meets the minimum", () => {
    expect(amountToQualify(percent, 200_000)).toBe(0);
  });
  it("returns 0 when subtotal exceeds the minimum", () => {
    expect(amountToQualify(percent, 500_000)).toBe(0);
  });
  it("returns 0 when voucher has no minSubtotal", () => {
    expect(amountToQualify(productVoucher, 0)).toBe(0);
  });
});
