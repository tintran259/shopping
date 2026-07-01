import { env } from "@/config/env";
import { useAuthStore } from "@/store/auth.store";
import type { OrderRecord } from "@/store/order.store";

/**
 * Order placement + tracking against the BE. Logged-in users check out from their
 * server cart (`POST /orders/checkout`); guests send the items in the body
 * (`POST /orders/guest-checkout`). Either way the BE recomputes prices/stock and
 * is the source of truth. Tracking is a public code+phone lookup.
 */

const API = env.apiUrl;

// FE payment id → BE PaymentMethodCode.
const PAYMENT_CODE: Record<string, string> = {
  cod: "cod",
  bank: "bank_transfer",
  momo: "momo",
};

// BE PaymentMethodCode → Vietnamese label.
const PAYMENT_LABEL: Record<string, string> = {
  cod: "Thanh toán khi nhận hàng (COD)",
  bank_transfer: "Chuyển khoản ngân hàng",
  momo: "Ví MoMo",
  card: "Thẻ ATM / Visa / Mastercard",
};

// BE OrderStatus → Vietnamese label for display.
const STATUS_LABEL: Record<string, string> = {
  pending: "Đang xử lý",
  confirmed: "Đã xác nhận",
  processing: "Đang chuẩn bị hàng",
  shipped: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

export interface OrderItemInput {
  id: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
}

export interface PlaceOrderInput {
  branchId: string;
  fulfillment: "delivery" | "pickup";
  recipient: { name: string; phone: string; email?: string };
  address?: { provinceCode?: string; province: string; wardCode?: string; ward: string; street: string };
  shippingMethodId: string;
  paymentMethodId: string;
  invoice?: { companyName: string; taxCode: string; address: string; email: string };
  voucherCode?: string | null;
  items: OrderItemInput[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
}

export interface PlacedOrder {
  id: string;
  createdAt: string;
}

/** Order code generator — exposed so the bank-transfer QR can preset the code (memo). */
export function newOrderId(): string {
  return "DH" + Date.now().toString(36).toUpperCase().slice(-8);
}

/** Shape the shared `CheckoutDto` fields (everything except cart items). */
function buildBody(input: PlaceOrderInput, code?: string): Record<string, unknown> {
  return {
    branchId: input.branchId,
    fulfillment: input.fulfillment,
    paymentMethodCode: PAYMENT_CODE[input.paymentMethodId] ?? input.paymentMethodId,
    recipientName: input.recipient.name,
    recipientPhone: input.recipient.phone,
    recipientEmail: input.recipient.email || undefined,
    voucherCode: input.voucherCode || undefined,
    shippingFee: input.shippingFee.toFixed(2),
    invoice: input.invoice,
    code,
    ...(input.fulfillment === "delivery" && input.address
      ? {
          shippingAddress: {
            recipientName: input.recipient.name,
            phone: input.recipient.phone,
            provinceCode: Number(input.address.provinceCode),
            wardCode: Number(input.address.wardCode),
            street: input.address.street,
          },
        }
      : {}),
  };
}

export async function placeOrder(input: PlaceOrderInput, code: string = newOrderId()): Promise<PlacedOrder> {
  const token = useAuthStore.getState().token;
  const body = buildBody(input, code);

  const url = token ? `${API}/orders/checkout` : `${API}/orders/guest-checkout`;
  const payload = token
    ? body
    : {
        ...body,
        items: input.items
          .filter((i) => i.variantId)
          .map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
      };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let message = "Đặt hàng thất bại, vui lòng thử lại.";
    try {
      const err = await res.json();
      const raw = Array.isArray(err?.message) ? err.message[0] : err?.message;
      if (raw) message = String(raw);
    } catch {
      // keep default
    }
    throw new Error(message);
  }
  const order = await res.json();
  return { id: order.code, createdAt: order.placedAt ?? order.createdAt ?? new Date().toISOString() };
}

interface ApiOrderItem {
  productName: string;
  unitPrice: string;
  quantity: number;
}
interface ApiOrder {
  code: string;
  status: string;
  paymentMethodCode?: string;
  fulfillment: "delivery" | "pickup";
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string;
  shippingAddress?: { provinceName?: string; wardName?: string; street?: string } | null;
  subtotal: string;
  shippingFee: string;
  discountTotal: string;
  grandTotal: string;
  currency: string;
  items: ApiOrderItem[];
  placedAt?: string;
  createdAt?: string;
}

function toOrderRecord(o: ApiOrder): OrderRecord {
  const addr = o.shippingAddress
    ? [o.shippingAddress.street, o.shippingAddress.wardName, o.shippingAddress.provinceName]
        .filter(Boolean)
        .join(", ")
    : undefined;
  return {
    id: o.code,
    createdAt: o.placedAt ?? o.createdAt ?? new Date().toISOString(),
    status: STATUS_LABEL[o.status] ?? o.status,
    recipientName: o.recipientName,
    phone: o.recipientPhone,
    email: o.recipientEmail || undefined,
    fulfillment: o.fulfillment,
    paymentMethodId: o.paymentMethodCode ?? "",
    paymentLabel: PAYMENT_LABEL[o.paymentMethodCode ?? ""] ?? "—",
    address: o.fulfillment === "delivery" ? addr : undefined,
    items: o.items.map((it) => ({
      id: it.productName,
      name: it.productName,
      price: Number(it.unitPrice),
      quantity: it.quantity,
    })),
    subtotal: Number(o.subtotal),
    shippingFee: Number(o.shippingFee),
    discount: Number(o.discountTotal),
    total: Number(o.grandTotal),
    currency: o.currency,
  };
}

/** Logged-in order history (paginated). Newest first. */
export async function fetchMyOrders(
  token: string,
  page = 1,
): Promise<{ orders: OrderRecord[]; page: number; pageCount: number }> {
  const res = await fetch(`${API}/orders?page=${page}&limit=20`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Không tải được đơn hàng");
  const body = await res.json();
  return {
    orders: (body.data ?? []).map(toOrderRecord),
    page: body.meta?.page ?? page,
    pageCount: body.meta?.pageCount ?? 1,
  };
}

/** Guest order tracking by code + phone (public). Returns null if not found. */
export async function trackOrder(code: string, phone: string): Promise<OrderRecord | null> {
  const qs = new URLSearchParams({ code: code.trim(), phone: phone.trim() });
  try {
    const res = await fetch(`${API}/orders/track?${qs.toString()}`);
    if (!res.ok) return null;
    return toOrderRecord(await res.json());
  } catch {
    return null;
  }
}
