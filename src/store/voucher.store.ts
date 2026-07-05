import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Voucher } from "@/services/voucher.service";

/**
 * The applied voucher (persisted). Stores the full `Voucher` object so the cart
 * and checkout can recompute the discount estimate locally (e.g. as qty changes)
 * without an extra network round-trip. The exact discount is always confirmed
 * server-side at checkout.
 */
interface VoucherState {
  appliedCode: string | null;
  /** Full voucher data for local discount math. */
  appliedVoucher: Voucher | null;
  apply: (voucher: Voucher) => void;
  clear: () => void;
}

export const useVoucherStore = create<VoucherState>()(
  persist(
    (set) => ({
      appliedCode: null,
      appliedVoucher: null,
      apply: (voucher) =>
        set({ appliedCode: voucher.code, appliedVoucher: voucher }),
      clear: () => set({ appliedCode: null, appliedVoucher: null }),
    }),
    { name: "voucher" },
  ),
);
