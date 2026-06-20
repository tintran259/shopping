/**
 * Shipping options + fee math (storefront/BE-owned commerce logic). Pure +
 * client-safe so checkout can compute live. Real rates come from a carrier API
 * later; this mock keys off whether the destination province matches the
 * fulfilling branch's province (intra-province is cheaper).
 */

export interface ShippingMethod {
  id: string;
  label: string;
  eta: string;
  fee: number;
}

/** Home-delivery methods, priced by distance proxy (same province or not). */
export function getDeliveryMethods(sameProvince: boolean): ShippingMethod[] {
  return [
    {
      id: "standard",
      label: "Giao tiêu chuẩn",
      eta: sameProvince ? "1–2 ngày" : "2–4 ngày",
      fee: sameProvince ? 18_000 : 30_000,
    },
    {
      id: "express",
      label: "Giao nhanh",
      eta: sameProvince ? "Trong ngày" : "1–2 ngày",
      fee: sameProvince ? 35_000 : 55_000,
    },
  ];
}

/** Pick up at the selected branch — always free. */
export const PICKUP_METHOD: ShippingMethod = {
  id: "pickup",
  label: "Nhận tại chi nhánh",
  eta: "Sẵn sàng trong 2 giờ",
  fee: 0,
};
