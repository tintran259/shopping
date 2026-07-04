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

// BE OrderStatus → Vietnamese label for DELIVERY orders.
const STATUS_LABEL: Record<string, string> = {
  pending: "Đang xử lý",
  confirmed: "Đã xác nhận",
  processing: "Đang chuẩn bị hàng",
  shipped: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

// PICKUP orders never ship. The BO advances them pending → confirmed →
// processing (= "Đã đóng hàng xong": packed, waiting at the branch) → delivered
// (= customer collected), SKIPPING `shipped` entirely (the dashboard filters it
// out of the dropdown — see shopping-dashboard orders/lib/labels.ts). Wording
// here mirrors that flow for the customer; `shipped` keeps the packed label as
// a safety net for stray data.
const PICKUP_STATUS_LABEL: Record<string, string> = {
  ...STATUS_LABEL,
  processing: "Đã đóng hàng — sẵn sàng nhận",
  shipped: "Đã đóng hàng — sẵn sàng nhận",
  delivered: "Đã nhận hàng",
};

/** Display label for a BE order status, worded per fulfillment. */
export function orderStatusLabel(
  status: string,
  fulfillment: "delivery" | "pickup",
): string {
  const map = fulfillment === "pickup" ? PICKUP_STATUS_LABEL : STATUS_LABEL;
  return map[status] ?? status;
}

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

// Fulfillment/payment → order-code prefix (mirrors BE OrdersService.generateOrderCode,
// keyed by the checkout's own ids so a future payment method just needs an entry here).
const FULFILLMENT_CODE_PREFIX: Record<"delivery" | "pickup", string> = {
  delivery: "GH",
  pickup: "PU",
};
const PAYMENT_CODE_PREFIX: Record<string, string> = {
  cod: "COD",
  bank: "BANK",
  momo: "MM",
  card: "TT",
};

/** Order code generator — exposed so the bank-transfer QR can preset the code (memo).
 *  Prefix must mirror the BE's so a client-preset code and a BE-generated fallback look
 *  the same. */
export function newOrderId(fulfillment: "delivery" | "pickup", paymentMethodId: string): string {
  const suffix = Date.now().toString(36).toUpperCase().slice(-8);
  const paymentPrefix = PAYMENT_CODE_PREFIX[paymentMethodId] ?? paymentMethodId.toUpperCase();
  return `${FULFILLMENT_CODE_PREFIX[fulfillment]}-${paymentPrefix}-${suffix}`;
}

/** Extract the BE's error message from a failed response (falls back per call). */
async function parseApiError(res: Response, fallback: string): Promise<Error> {
  let message = fallback;
  try {
    const err = await res.json();
    const raw = Array.isArray(err?.message) ? err.message[0] : err?.message;
    if (raw) message = String(raw);
  } catch {
    // keep default
  }
  return new Error(message);
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

export async function placeOrder(
  input: PlaceOrderInput,
  code: string = newOrderId(input.fulfillment, input.paymentMethodId),
): Promise<PlacedOrder> {
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
  if (!res.ok) throw await parseApiError(res, "Đặt hàng thất bại, vui lòng thử lại.");
  const order = await res.json();
  return { id: order.code, createdAt: order.placedAt ?? order.createdAt ?? new Date().toISOString() };
}

// Statuses the customer may still cancel from (mirrors the BE guard).
const CANCELLABLE_STATUS = new Set(["pending", "confirmed"]);

interface ApiOrderItem {
  productName: string;
  variantTitle?: string;
  unitPrice: string;
  quantity: number;
  imageUrl?: string;
}
interface ApiOrder {
  id: string;
  code: string;
  status: string;
  paymentMethodCode?: string;
  fulfillment: "delivery" | "pickup";
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string;
  shippingAddress?: { provinceName?: string; wardName?: string; street?: string } | null;
  branch?: { name: string; phone?: string | null; address?: string | null } | null;
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
    uuid: o.id,
    cancellable: CANCELLABLE_STATUS.has(o.status),
    createdAt: o.placedAt ?? o.createdAt ?? new Date().toISOString(),
    status: orderStatusLabel(o.status, o.fulfillment),
    statusCode: o.status,
    recipientName: o.recipientName,
    phone: o.recipientPhone,
    email: o.recipientEmail || undefined,
    fulfillment: o.fulfillment,
    paymentMethodId: o.paymentMethodCode ?? "",
    paymentLabel: PAYMENT_LABEL[o.paymentMethodCode ?? ""] ?? "—",
    branchName: o.branch?.name,
    branchPhone: o.branch?.phone ?? undefined,
    address: o.fulfillment === "delivery" ? addr : undefined,
    items: o.items.map((it, idx) => ({
      id: `${it.productName}-${idx}`,
      name: it.productName,
      detail: it.variantTitle || undefined,
      price: Number(it.unitPrice),
      quantity: it.quantity,
      image: it.imageUrl ? { url: it.imageUrl, alt: it.productName } : undefined,
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

/** Cancel one of my orders (Bearer). Returns the updated record. Throws the BE
 *  message (e.g. "Đơn hàng đang được xử lý…") when it can't be cancelled. */
export async function cancelOrder(token: string, orderUuid: string): Promise<OrderRecord> {
  const res = await fetch(`${API}/orders/${orderUuid}/cancel`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await parseApiError(res, "Hủy đơn thất bại, vui lòng thử lại.");
  return toOrderRecord(await res.json());
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
