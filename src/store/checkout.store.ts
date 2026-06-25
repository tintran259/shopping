import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CheckoutAddress {
  /** Administrative codes (2-tier model) — cascading selects + shipping match. */
  provinceCode: string;
  wardCode: string;
  /** Human-readable names (stored for display + the order record). */
  province: string;
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
  wardCode: "",
  province: "",
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
      version: 3,
      // Address shape changed (v2: codes; v3: dropped district) — reset address for old drafts.
      migrate: (persisted, version) => {
        const s = (persisted ?? {}) as Partial<CheckoutState>;
        if (version < 3) return { ...s, address: EMPTY_ADDRESS };
        return s;
      },
    },
  ),
);
