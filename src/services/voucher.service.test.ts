import { describe, it, expect } from "vitest";
import {
  findVoucher,
  validateVoucher,
  discountFor,
  shippingDiscountFor,
  amountToQualify,
  type Voucher,
  type VoucherContext,
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
    { id: "p-a", slug: "san-pham-a", name: "Sản phẩm A" },
    { id: "p-b", slug: "san-pham-b", name: "Sản phẩm B" },
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
  applicableProducts: [{ id: "p-a", slug: "san-pham-a", name: "Sản phẩm A" }],
  applicableBranches: [{ id: "branch-q1", name: "Chi nhánh Q1" }],
};

const requiresAuthVoucher: Voucher = {
  code: "VIP",
  label: "Khách VIP",
  type: "fixed",
  value: 100_000,
  description: "Chỉ dành cho khách đã đăng nhập",
  requiresAuth: true,
};

const requiresAuthWithProducts: Voucher = {
  code: "VIP_COMBO",
  label: "VIP + Sản phẩm",
  type: "percent",
  value: 20,
  minSubtotal: 150_000,
  maxDiscount: 100_000,
  description: "Giảm 20% cho khách VIP có sản phẩm A tại Q1",
  requiresAuth: true,
  applicableProducts: [{ id: "p-a", slug: "san-pham-a", name: "Sản phẩm A" }],
  applicableBranches: [{ id: "branch-q1", name: "Chi nhánh Q1" }],
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
  it("handles empty list", () => {
    expect(findVoucher("P10", [])).toBeUndefined();
  });
});

// ── validateVoucher — expiry + minSubtotal ────────────────────────────────────

describe("validateVoucher — expiry + minSubtotal", () => {
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
    const r = validateVoucher(expired, 999_000);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("Mã đã hết hạn");
  });
  it("expiry is checked before minSubtotal", () => {
    expect(validateVoucher(expired, 0).ok).toBe(false);
  });
  it("accepts vouchers with no minSubtotal (unrestricted voucher, full ctx)", () => {
    expect(validateVoucher(percent, 0, { branchId: undefined, cartSlugs: [], customerId: undefined }).ok).toBe(false);
    expect(validateVoucher(fixed, 400_000).ok).toBe(true);
  });
});

// ── validateVoucher — product scope (fail-closed) ─────────────────────────────

describe("validateVoucher — product scope (fail-closed)", () => {
  it("passes when cart contains at least one required product", () => {
    const r = validateVoucher(productVoucher, 0, { cartSlugs: ["san-pham-a", "other"] });
    expect(r.ok).toBe(true);
  });
  it("passes when only product B is in cart", () => {
    expect(validateVoucher(productVoucher, 0, { cartSlugs: ["san-pham-b"] }).ok).toBe(true);
  });
  it("fails when no cart product matches required list", () => {
    const r = validateVoucher(productVoucher, 0, { cartSlugs: ["san-pham-x", "san-pham-y"] });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("Sản phẩm A");
    expect(r.reason).toContain("Sản phẩm B");
  });
  it("fails (fail-closed) when cartSlugs is empty — no products at all", () => {
    const r = validateVoucher(productVoucher, 0, { cartSlugs: [] });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("Giỏ hàng không có sản phẩm áp dụng mã này");
  });
  it("fails (fail-closed) when cartSlugs is not provided — treats as empty", () => {
    const r = validateVoucher(productVoucher, 0, {});
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("Giỏ hàng không có sản phẩm áp dụng mã này");
  });
  it("fails (fail-closed) when no context at all", () => {
    expect(validateVoucher(productVoucher, 0).ok).toBe(false);
  });
  it("passes any product when voucher has no product restriction", () => {
    expect(validateVoucher(percent, 200_000, { cartSlugs: ["random-slug"] }).ok).toBe(true);
  });
  it("unrestricted voucher passes with empty cartSlugs", () => {
    expect(validateVoucher(percent, 200_000, { cartSlugs: [] }).ok).toBe(true);
  });
});

// ── validateVoucher — branch scope (fail-closed) ──────────────────────────────

describe("validateVoucher — branch scope (fail-closed)", () => {
  it("passes when branchId matches an applicable branch", () => {
    expect(validateVoucher(branchVoucher, 0, { branchId: "branch-q1" }).ok).toBe(true);
  });
  it("fails with a reason when branchId is not in applicableBranches", () => {
    const r = validateVoucher(branchVoucher, 0, { branchId: "branch-q3" });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("Chi nhánh Q1");
  });
  it("fails (fail-closed) when branchId is not provided — no branch selected", () => {
    const r = validateVoucher(branchVoucher, 0, {});
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("Vui lòng chọn chi nhánh để sử dụng mã này");
  });
  it("fails (fail-closed) when no context at all", () => {
    expect(validateVoucher(branchVoucher, 0).ok).toBe(false);
  });
  it("passes any branch when voucher has no branch restriction", () => {
    expect(validateVoucher(percent, 200_000, { branchId: "any-branch" }).ok).toBe(true);
  });
  it("unrestricted voucher passes without branchId", () => {
    expect(validateVoucher(percent, 200_000).ok).toBe(true);
  });
});

// ── validateVoucher — product checked before branch ───────────────────────────

describe("validateVoucher — check order: product before branch", () => {
  it("reports product mismatch before branch mismatch", () => {
    const r = validateVoucher(comboVoucher, 0, {
      cartSlugs: ["other"],
      branchId: "branch-q3",
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("Sản phẩm A");
  });
  it("reports branch mismatch when product matches but branch doesn't", () => {
    const r = validateVoucher(comboVoucher, 0, {
      cartSlugs: ["san-pham-a"],
      branchId: "branch-q3",
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("Chi nhánh Q1");
  });
  it("passes when both product and branch match", () => {
    expect(validateVoucher(comboVoucher, 0, {
      cartSlugs: ["san-pham-a"],
      branchId: "branch-q1",
    }).ok).toBe(true);
  });
  it("reports missing-product over missing-branch", () => {
    const r = validateVoucher(comboVoucher, 0, { cartSlugs: [] });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("Giỏ hàng không có sản phẩm áp dụng mã này");
  });
});

// ── validateVoucher — requiresAuth (customers scope) ─────────────────────────

describe("validateVoucher — requiresAuth", () => {
  it("passes when logged-in (customerId provided)", () => {
    expect(validateVoucher(requiresAuthVoucher, 0, { customerId: "cust-abc" }).ok).toBe(true);
  });
  it("fails when guest (no customerId)", () => {
    const r = validateVoucher(requiresAuthVoucher, 0, {});
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("Yêu cầu đăng nhập để sử dụng mã này");
  });
  it("fails when no context", () => {
    expect(validateVoucher(requiresAuthVoucher, 0).ok).toBe(false);
  });
  it("unrestricted vouchers pass without customerId", () => {
    expect(validateVoucher(percent, 200_000).ok).toBe(true);
  });
  it("unrestricted vouchers pass with customerId", () => {
    expect(validateVoucher(percent, 200_000, { customerId: "cust-abc" }).ok).toBe(true);
  });
});

// ── validateVoucher — guestsOnly scope ───────────────────────────────────────

describe("validateVoucher — guestsOnly", () => {
  it("passes for guest (no customerId)", () => {
    expect(validateVoucher(guestVoucher, 0).ok).toBe(true);
  });
  it("passes when ctx.customerId is undefined", () => {
    expect(validateVoucher(guestVoucher, 0, { customerId: undefined }).ok).toBe(true);
  });
  it("fails when logged-in user tries to apply", () => {
    const r = validateVoucher(guestVoucher, 0, { customerId: "cust-abc" });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("Chỉ áp dụng cho khách vãng lai (không cần tài khoản)");
  });
  it("non-guestsOnly vouchers are unaffected by customerId", () => {
    expect(validateVoucher(percent, 200_000, { customerId: "cust-abc" }).ok).toBe(true);
  });
});

// ── validateVoucher — requiresAuth + product + branch (realistic voucher) ─────

describe("validateVoucher — requiresAuth + product + branch (e.g. FREESHIP_COMBO_3)", () => {
  const fullCtx: VoucherContext = {
    customerId: "cust-abc",
    cartSlugs: ["san-pham-a", "other"],
    branchId: "branch-q1",
  };

  it("passes when all conditions met", () => {
    expect(validateVoucher(requiresAuthWithProducts, 150_000, fullCtx).ok).toBe(true);
  });
  it("fails when subtotal below minimum (all else met)", () => {
    const r = validateVoucher(requiresAuthWithProducts, 100_000, fullCtx);
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("tối thiểu");
  });
  it("fails when product not in cart (all else met)", () => {
    const r = validateVoucher(requiresAuthWithProducts, 150_000, {
      ...fullCtx,
      cartSlugs: ["other-product"],
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("Sản phẩm A");
  });
  it("fails (fail-closed) when cartSlugs missing (all else met)", () => {
    const r = validateVoucher(requiresAuthWithProducts, 150_000, {
      ...fullCtx,
      cartSlugs: undefined,
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("Giỏ hàng không có sản phẩm áp dụng mã này");
  });
  it("fails when branch does not match (all else met)", () => {
    const r = validateVoucher(requiresAuthWithProducts, 150_000, {
      ...fullCtx,
      branchId: "branch-q7",
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("Chi nhánh Q1");
  });
  it("fails (fail-closed) when branchId missing (all else met)", () => {
    const r = validateVoucher(requiresAuthWithProducts, 150_000, {
      ...fullCtx,
      branchId: undefined,
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("Vui lòng chọn chi nhánh để sử dụng mã này");
  });
  it("fails when guest (no customerId, all else met)", () => {
    const r = validateVoucher(requiresAuthWithProducts, 150_000, {
      ...fullCtx,
      customerId: undefined,
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("Yêu cầu đăng nhập để sử dụng mã này");
  });
});

// ── auto-clear reason classification ─────────────────────────────────────────
// These strings are used by VoucherSection to decide which useEffect clears
// the applied voucher (scope-change vs auth-change). They must stay in sync.

describe("validateVoucher — reason strings for auto-clear classification", () => {
  const AUTH_REASONS = [
    "Yêu cầu đăng nhập để sử dụng mã này",
    "Chỉ áp dụng cho khách vãng lai (không cần tài khoản)",
  ];

  it("requiresAuth failure produces an auth reason (scope-change effect should skip)", () => {
    const r = validateVoucher(requiresAuthVoucher, 0, {});
    expect(AUTH_REASONS).toContain(r.reason);
  });
  it("guestsOnly failure produces an auth reason (scope-change effect should skip)", () => {
    const r = validateVoucher(guestVoucher, 0, { customerId: "cust" });
    expect(AUTH_REASONS).toContain(r.reason);
  });
  it("product removal produces a non-auth reason (scope-change effect should clear)", () => {
    const r = validateVoucher(productVoucher, 0, { cartSlugs: [] });
    expect(AUTH_REASONS).not.toContain(r.reason);
  });
  it("branch change produces a non-auth reason (scope-change effect should clear)", () => {
    const r = validateVoucher(branchVoucher, 0, { branchId: "wrong" });
    expect(AUTH_REASONS).not.toContain(r.reason);
  });
  it("subtotal drop produces a non-auth reason (scope-change effect should clear)", () => {
    const r = validateVoucher(percent, 100_000);
    expect(AUTH_REASONS).not.toContain(r.reason);
  });
  it("requiresAuth + product removed → product reason, not auth reason", () => {
    const r = validateVoucher(requiresAuthWithProducts, 150_000, {
      customerId: "cust-abc",
      cartSlugs: [],
      branchId: "branch-q1",
    });
    expect(r.ok).toBe(false);
    expect(AUTH_REASONS).not.toContain(r.reason);
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
  it("returns 0 when product scope fails — no matching slug", () => {
    expect(discountFor(productVoucher, 500_000, { cartSlugs: ["other"] })).toBe(0);
  });
  it("returns 0 (fail-closed) when product scope fails — empty cartSlugs", () => {
    expect(discountFor(productVoucher, 500_000, { cartSlugs: [] })).toBe(0);
  });
  it("returns 0 (fail-closed) when product voucher has no ctx", () => {
    expect(discountFor(productVoucher, 500_000)).toBe(0);
  });
  it("computes correctly when product scope passes", () => {
    expect(discountFor(productVoucher, 500_000, { cartSlugs: ["san-pham-a"] })).toBe(100_000);
  });
  it("returns 0 when branch scope fails — wrong branch", () => {
    expect(discountFor(branchVoucher, 500_000, { branchId: "other-branch" })).toBe(0);
  });
  it("returns 0 (fail-closed) when branch voucher has no branchId in ctx", () => {
    expect(discountFor(branchVoucher, 500_000, {})).toBe(0);
  });
  it("returns 0 (fail-closed) when branch voucher has no ctx", () => {
    expect(discountFor(branchVoucher, 500_000)).toBe(0);
  });
  it("computes full combo voucher (product + branch + auth all satisfied)", () => {
    expect(
      discountFor(requiresAuthWithProducts, 600_000, {
        customerId: "cust-abc",
        cartSlugs: ["san-pham-a"],
        branchId: "branch-q1",
      }),
    ).toBe(100_000); // 20% of 600K = 120K, capped at maxDiscount 100K
  });
  it("returns 0 for combo voucher when auth missing (even if branch + product match)", () => {
    expect(
      discountFor(requiresAuthWithProducts, 600_000, {
        cartSlugs: ["san-pham-a"],
        branchId: "branch-q1",
      }),
    ).toBe(0);
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
  it("respects branch scope — fails when branch doesn't match", () => {
    const shipBranch: Voucher = {
      ...ship,
      code: "SHIPBRANCH",
      applicableBranches: [{ id: "b1", name: "Q1" }],
    };
    expect(shippingDiscountFor(shipBranch, 200_000, 30_000, { branchId: "other" })).toBe(0);
    expect(shippingDiscountFor(shipBranch, 200_000, 30_000, { branchId: "b1" })).toBe(30_000);
  });
  it("respects branch scope (fail-closed) — no branchId → 0", () => {
    const shipBranch: Voucher = {
      ...ship,
      code: "SHIPBRANCH2",
      applicableBranches: [{ id: "b1", name: "Q1" }],
    };
    expect(shippingDiscountFor(shipBranch, 200_000, 30_000, {})).toBe(0);
  });
});

// ── amountToQualify ───────────────────────────────────────────────────────────

describe("amountToQualify", () => {
  it("returns the gap to the minimum when subtotal is below", () => {
    expect(amountToQualify(percent, 150_000)).toBe(50_000);
  });
  it("returns 0 when subtotal meets the minimum exactly", () => {
    expect(amountToQualify(percent, 200_000)).toBe(0);
  });
  it("returns 0 when subtotal exceeds the minimum", () => {
    expect(amountToQualify(percent, 500_000)).toBe(0);
  });
  it("returns 0 when voucher has no minSubtotal", () => {
    expect(amountToQualify(productVoucher, 0)).toBe(0);
  });
  it("returns 0 when voucher has no minSubtotal, any subtotal", () => {
    expect(amountToQualify(productVoucher, 999_999)).toBe(0);
  });
  it("handles edge case: subtotal = 0, minSubtotal > 0", () => {
    expect(amountToQualify(percent, 0)).toBe(200_000);
  });
});
