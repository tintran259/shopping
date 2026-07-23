import { env } from "@/config/env";

const API = env.apiUrl;

interface SubscribeBackInStockInput {
  variantId: string;
  contact: string;
  branchId?: string;
  customerId?: string;
}

export async function checkPendingSubscription(input: {
  variantId: string;
  contact: string;
  branchId?: string;
}): Promise<boolean> {
  try {
    const params = new URLSearchParams({ variantId: input.variantId, contact: input.contact });
    if (input.branchId) params.set("branchId", input.branchId);
    const res = await fetch(`${API}/notifications/back-in-stock/pending?${params.toString()}`);
    if (!res.ok) return true; // fail-safe: assume still pending to avoid false reset
    const data = await res.json() as { pending: boolean };
    return data.pending;
  } catch {
    return true; // network error → assume pending
  }
}

export async function subscribeBackInStock(input: SubscribeBackInStockInput): Promise<void> {
  const res = await fetch(`${API}/notifications/back-in-stock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { message?: string | string[] };
    throw new Error(
      Array.isArray(data.message)
        ? data.message[0]
        : typeof data.message === "string"
          ? data.message
          : "Không thể đăng ký thông báo",
    );
  }
}
