import { describe, it, expect } from "vitest";
import {
  findVoucher,
  validateVoucher,
  discountFor,
  shippingDiscountFor,
  amountToQualify,
  type Voucher,
} from "./voucher.service";

const percent: Voucher = { code: "P10", label: "", type: "percent", value: 10, minSubtotal: 200_000, maxDiscount: 30_000, description: "" };
const fixed: Voucher = { code: "F50", label: "", type: "fixed", value: 50_000, minSubtotal: 300_000, description: "" };
const ship: Voucher = { code: "SHIP", label: "", type: "shipping", value: 30_000, minSubtotal: 150_000, description: "" };
const expired: Voucher = { code: "OLD", label: "", type: "fixed", value: 10_000, description: "", expiresAt: "2020-01-01T00:00:00+07:00" };

describe("findVoucher", () => {
  it("is case-insensitive and trims", () => {
    expect(findVoucher(" dacsan10 ")?.code).toBe("DACSAN10");
  });
  it("returns undefined for unknown codes", () => {
    expect(findVoucher("NOPE")).toBeUndefined();
  });
});

describe("validateVoucher", () => {
  it("rejects below minimum subtotal", () => {
    const r = validateVoucher(percent, 150_000);
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("tối thiểu");
  });
  it("accepts at/above minimum", () => {
    expect(validateVoucher(percent, 200_000).ok).toBe(true);
  });
  it("rejects expired vouchers", () => {
    expect(validateVoucher(expired, 999_000).ok).toBe(false);
  });
});

describe("discountFor", () => {
  it("applies percent and caps at maxDiscount", () => {
    expect(discountFor(percent, 200_000)).toBe(20_000); // 10% of 200k
    expect(discountFor(percent, 1_000_000)).toBe(30_000); // capped
  });
  it("applies fixed amount, never exceeding subtotal", () => {
    expect(discountFor(fixed, 300_000)).toBe(50_000);
  });
  it("returns 0 for shipping vouchers (resolved at checkout)", () => {
    expect(discountFor(ship, 200_000)).toBe(0);
  });
  it("returns 0 when not eligible", () => {
    expect(discountFor(percent, 100_000)).toBe(0);
  });
});

describe("shippingDiscountFor", () => {
  it("discounts shipping up to its value when eligible", () => {
    expect(shippingDiscountFor(ship, 200_000, 30_000)).toBe(30_000);
    expect(shippingDiscountFor(ship, 200_000, 18_000)).toBe(18_000); // capped at fee
  });
  it("is 0 for non-shipping vouchers", () => {
    expect(shippingDiscountFor(percent, 200_000, 30_000)).toBe(0);
  });
  it("is 0 when not eligible or fee is 0 (pickup)", () => {
    expect(shippingDiscountFor(ship, 100_000, 30_000)).toBe(0);
    expect(shippingDiscountFor(ship, 200_000, 0)).toBe(0);
  });
});

describe("amountToQualify", () => {
  it("is the gap to the minimum, 0 when reached", () => {
    expect(amountToQualify(percent, 150_000)).toBe(50_000);
    expect(amountToQualify(percent, 200_000)).toBe(0);
  });
});
