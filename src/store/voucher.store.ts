import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * The applied voucher code (persisted). Lookup/validation/math live in
 * `voucher.service` — this store only remembers WHICH code the shopper chose, so the
 * cart and checkout resolve the same discount against the current subtotal.
 */
interface VoucherState {
  appliedCode: string | null;
  apply: (code: string) => void;
  clear: () => void;
}

export const useVoucherStore = create<VoucherState>()(
  persist(
    (set) => ({
      appliedCode: null,
      apply: (code) => set({ appliedCode: code.trim().toUpperCase() }),
      clear: () => set({ appliedCode: null }),
    }),
    { name: "voucher" },
  ),
);
