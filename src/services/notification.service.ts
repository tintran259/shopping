import { env } from "@/config/env";

const API = env.apiUrl;

interface SubscribeBackInStockInput {
  variantId: string;
  contact: string;
  branchId?: string;
  customerId?: string;
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
