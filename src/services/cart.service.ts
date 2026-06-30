import { env } from "@/config/env";
import { useCartStore, type CartLine } from "@/store/cart.store";

/**
 * Cart BE integration (logged-in users). The BE returns lines already shaped like
 * the FE `CartLine` (id = cart-item id, plus variantId + full product snapshot), so
 * the cart renders without a refetch. Guests use the local Zustand store; on login
 * `mergeGuestCart` replays the guest's lines into the account cart.
 */

const API = env.apiUrl;

export interface ApiCart {
  id: string;
  branchId?: string | null;
  currency: string;
  lines: CartLine[];
  itemCount: number;
  subtotal: string;
}

const headers = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

/** Map a BE error response to a friendly Vietnamese message (keeps the stock count). */
function toFriendly(message: string): string {
  const only = message.match(/Only (\d+) in stock/i);
  if (only) return `Chỉ còn ${only[1]} sản phẩm trong kho`;
  if (/out of stock/i.test(message)) return "Sản phẩm đã hết hàng tại chi nhánh này";
  if (/variant unavailable/i.test(message)) return "Sản phẩm này hiện không khả dụng";
  return message;
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    const raw = Array.isArray(body?.message) ? body.message[0] : body?.message;
    return raw ? toFriendly(String(raw)) : fallback;
  } catch {
    return fallback;
  }
}

export async function fetchCart(token: string): Promise<CartLine[]> {
  const res = await fetch(`${API}/cart`, { headers: headers(token) });
  if (!res.ok) throw new Error("Không tải được giỏ hàng");
  const cart: ApiCart = await res.json();
  return cart.lines;
}

export async function addCartItem(
  token: string,
  variantId: string,
  quantity: number,
  branchId?: string,
): Promise<void> {
  const res = await fetch(`${API}/cart/items`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ variantId, quantity, branchId }),
  });
  if (!res.ok) throw new Error(await readError(res, "Không thêm được vào giỏ"));
}

export async function updateCartItem(
  token: string,
  itemId: string,
  quantity: number,
): Promise<void> {
  const res = await fetch(`${API}/cart/items/${itemId}`, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify({ quantity }),
  });
  if (!res.ok) throw new Error(await readError(res, "Không cập nhật được giỏ"));
}

export async function removeCartItem(token: string, itemId: string): Promise<void> {
  const res = await fetch(`${API}/cart/items/${itemId}`, {
    method: "DELETE",
    headers: headers(token),
  });
  if (!res.ok) throw new Error("Không xóa được sản phẩm");
}

export async function clearCart(token: string): Promise<void> {
  const res = await fetch(`${API}/cart`, { method: "DELETE", headers: headers(token) });
  if (!res.ok) throw new Error("Không xóa được giỏ");
}

// Shared in-flight guard so concurrent hook instances merge exactly once.
let mergePromise: Promise<boolean> | null = null;

/** Replay the guest's local lines into the account cart once, then clear them.
 *  Resolves `true` if anything was merged (caller can refetch only then). */
export function mergeGuestCart(token: string, branchId?: string): Promise<boolean> {
  if (mergePromise) return mergePromise;
  mergePromise = doMerge(token, branchId).finally(() => {
    mergePromise = null;
  });
  return mergePromise;
}

async function doMerge(token: string, branchId?: string): Promise<boolean> {
  const lines = useCartStore.getState().lines;
  if (!lines.length) return false;
  for (const line of lines) {
    if (!line.variantId) continue; // can't sync a line without a variant
    // BE merges quantities + validates stock; ignore per-line failures (e.g. OOS).
    await addCartItem(token, line.variantId, line.quantity, branchId).catch(() => {});
  }
  useCartStore.getState().clear();
  return true;
}
