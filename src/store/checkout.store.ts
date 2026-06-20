import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CheckoutAddress {
  province: string;
  district: string;
  ward: string;
  street: string;
}

export type Fulfillment = "delivery" | "pickup";

interface CheckoutState {
  recipientName: string;
  phone: string;
  email: string;
  address: CheckoutAddress;
  fulfillment: Fulfillment;
  /** Selected home-delivery method (ignored when fulfillment = pickup). */
  shippingMethodId: string;
  paymentMethodId: string;
  update: (patch: Partial<Omit<CheckoutState, "update" | "setAddress" | "reset">>) => void;
  setAddress: (patch: Partial<CheckoutAddress>) => void;
  reset: () => void;
}

const EMPTY_ADDRESS: CheckoutAddress = { province: "", district: "", ward: "", street: "" };

/**
 * Checkout draft (persisted) — recipient, address, and the chosen delivery/payment
 * options. Survives reload so a shopper doesn't re-type. The applied voucher lives
 * in `voucher.store`; cart items in `cart.store`.
 */
export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      recipientName: "",
      phone: "",
      email: "",
      address: EMPTY_ADDRESS,
      fulfillment: "delivery",
      shippingMethodId: "standard",
      paymentMethodId: "cod",
      update: (patch) => set(patch),
      setAddress: (patch) => set((s) => ({ address: { ...s.address, ...patch } })),
      reset: () =>
        set({
          recipientName: "",
          phone: "",
          email: "",
          address: EMPTY_ADDRESS,
          fulfillment: "delivery",
          shippingMethodId: "standard",
          paymentMethodId: "cod",
        }),
    }),
    { name: "checkout" },
  ),
);
