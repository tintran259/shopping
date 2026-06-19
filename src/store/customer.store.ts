import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CustomerState {
  email: string | null;
  phone: string | null;
  setEmail: (email: string | null) => void;
  setPhone: (phone: string | null) => void;
  clear: () => void;
}

/**
 * Client-side customer profile (Zustand, persisted). Stands in for the account
 * system until auth exists. Seeded with BOTH contacts so flows that depend on
 * how many contacts a customer has (e.g. back-in-stock notify) are exercisable;
 * clear one to test the single-contact path. Replace with real auth/BE later.
 */
export const useCustomerStore = create<CustomerState>()(
  persist(
    (set) => ({
      email: "khachhang@example.com",
      phone: "0901234567",
      setEmail: (email) => set({ email }),
      setPhone: (phone) => set({ phone }),
      clear: () => set({ email: null, phone: null }),
    }),
    { name: "customer" },
  ),
);
