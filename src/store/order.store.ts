import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface OrderRecordItem {
  id: string;
  /** BE variant UUID — required when submitting a per-item review. */
  variantId?: string;
  name: string;
  /** Variant label, e.g. "500g" or "Đen · M". */
  detail?: string;
  price: number;
  quantity: number;
  image?: { url?: string; alt?: string };
}

export interface OrderRecord {
  id: string;
  /** BE order UUID (needed to cancel). Absent for device-local guest records. */
  uuid?: string;
  /** BE says this order may still be cancelled by the customer. */
  cancellable?: boolean;
  createdAt: string;
  /** Display label, already worded per fulfillment (see `orderStatusLabel`). */
  status: string;
  /** Raw BE status code (`pending`…`cancelled`) — use this for logic, not the
   *  label. Absent on device-local records written at checkout time. */
  statusCode?: string;
  recipientName: string;
  phone: string;
  email?: string;
  fulfillment: "delivery" | "pickup";
  paymentMethodId: string;
  paymentLabel: string;
  branchName?: string;
  branchPhone?: string;
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
