import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface OrderRecordItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: { url?: string; alt?: string };
}

export interface OrderRecord {
  id: string;
  createdAt: string;
  status: string;
  recipientName: string;
  phone: string;
  email?: string;
  fulfillment: "delivery" | "pickup";
  paymentMethodId: string;
  paymentLabel: string;
  branchName?: string;
  address?: string;
  items: OrderRecordItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  currency: string;
}

interface OrderState {
  orders: OrderRecord[];
  addOrder: (o: OrderRecord) => void;
  /** Guest lookup: match by order id + phone (both normalized). */
  find: (id: string, phone: string) => OrderRecord | undefined;
  /** Lookup by id only — used by the confirmation route right after placing. */
  getById: (id: string) => OrderRecord | undefined;
  clear: () => void;
}

const normPhone = (p: string) => p.replace(/\s+/g, "");

/**
 * Placed orders kept client-side (persisted) so a guest can look up an order by
 * code + phone without an account. Device-local only — a real BE lookup would
 * query by code+phone server-side; swap `find` for that call later.
 */
export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      addOrder: (o) => set((s) => ({ orders: [o, ...s.orders] })),
      find: (id, phone) => {
        const code = id.trim().toUpperCase();
        const ph = normPhone(phone);
        return get().orders.find((o) => o.id.toUpperCase() === code && normPhone(o.phone) === ph);
      },
      getById: (id) => {
        const code = id.trim().toUpperCase();
        return get().orders.find((o) => o.id.toUpperCase() === code);
      },
      clear: () => set({ orders: [] }),
    }),
    { name: "orders" },
  ),
);
