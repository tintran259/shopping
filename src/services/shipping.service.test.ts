import { describe, it, expect } from "vitest";
import { getDeliveryMethods, PICKUP_METHOD } from "./shipping.service";

describe("getDeliveryMethods", () => {
  it("is cheaper within the same province", () => {
    const same = getDeliveryMethods(true);
    const other = getDeliveryMethods(false);
    const stdSame = same.find((m) => m.id === "standard")!;
    const stdOther = other.find((m) => m.id === "standard")!;
    expect(stdSame.fee).toBeLessThan(stdOther.fee);
    expect(stdSame.fee).toBe(18_000);
    expect(stdOther.fee).toBe(30_000);
  });

  it("offers standard + express", () => {
    const ids = getDeliveryMethods(false).map((m) => m.id);
    expect(ids).toEqual(["standard", "express"]);
  });
});

describe("PICKUP_METHOD", () => {
  it("is always free", () => {
    expect(PICKUP_METHOD.fee).toBe(0);
  });
});
