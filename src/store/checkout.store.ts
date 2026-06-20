import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CheckoutAddress {
  /** Administrative codes (open API) — used for cascading selects + shipping match. */
  provinceCode: string;
  districtCode: string;
  wardCode: string;
  /** Human-readable names (stored for display + the order record). */
  province: string;
  district: string;
  ward: string;
  street: string;
}

/** VAT (red) invoice request — mainly for B2B, optional for anyone. */
export interface InvoiceInfo {
  requested: boolean;
  companyName: string;
  taxCode: string;
  address: string;
  email: string;
}

export type Fulfillment = "delivery" | "pickup";

interface CheckoutState {
  recipientName: string;
  phone: string;
  email: string;
  address: CheckoutAddress;
  invoice: InvoiceInfo;
  fulfillment: Fulfillment;
  /** Selected home-delivery method (ignored when fulfillment = pickup). */
  shippingMethodId: string;
  paymentMethodId: string;
  update: (patch: Partial<Omit<CheckoutState, "update" | "setAddress" | "setInvoice" | "reset">>) => void;
  setAddress: (patch: Partial<CheckoutAddress>) => void;
  setInvoice: (patch: Partial<InvoiceInfo>) => void;
  reset: () => void;
}

const EMPTY_ADDRESS: CheckoutAddress = {
  provinceCode: "",
  districtCode: "",
  wardCode: "",
  province: "",
  district: "",
  ward: "",
  street: "",
};
const EMPTY_INVOICE: InvoiceInfo = { requested: false, companyName: "", taxCode: "", address: "", email: "" };

/**
 * Checkout draft (persisted) — recipient, address, VAT-invoice request, and the chosen
 * delivery/payment options. Survives reload so a shopper doesn't re-type. The applied
 * voucher lives in `voucher.store`; cart items in `cart.store`.
 */
export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      recipientName: "",
      phone: "",
      email: "",
      address: EMPTY_ADDRESS,
      invoice: EMPTY_INVOICE,
      fulfillment: "delivery",
      shippingMethodId: "standard",
      paymentMethodId: "cod",
      update: (patch) => set(patch),
      setAddress: (patch) => set((s) => ({ address: { ...s.address, ...patch } })),
      setInvoice: (patch) => set((s) => ({ invoice: { ...s.invoice, ...patch } })),
      reset: () =>
        set({
          recipientName: "",
          phone: "",
          email: "",
          address: EMPTY_ADDRESS,
          invoice: EMPTY_INVOICE,
          fulfillment: "delivery",
          shippingMethodId: "standard",
          paymentMethodId: "cod",
        }),
    }),
    {
      name: "checkout",
      version: 2,
      // Address gained admin codes in v2 — reset just the address for old drafts.
      migrate: (persisted, version) => {
        const s = (persisted ?? {}) as Partial<CheckoutState>;
        if (version < 2) return { ...s, address: EMPTY_ADDRESS };
        return s;
      },
    },
  ),
);
