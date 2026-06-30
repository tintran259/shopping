import { env } from "@/config/env";
import { useWishlistStore } from "@/store/wishlist.store";
import type { ProductSummary } from "@/types/product";

/**
 * Wishlist BE integration (logged-in users). Lists carry their server item ids
 * (needed to remove items) plus full product summaries so pages render without
 * a refetch. Guests use the local Zustand store; on login `mergeGuestWishlist`
 * pushes the guest's lists into the account, then clears the local copy.
 */

const API = env.apiUrl;

export interface ApiWishlistItem {
  id: string;
  variantId: string | null;
  product: ProductSummary;
}
export interface ApiWishlist {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  items: ApiWishlistItem[];
}

const headers = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export async function fetchWishlists(token: string): Promise<ApiWishlist[]> {
  const res = await fetch(`${API}/wishlist`, { headers: headers(token) });
  if (!res.ok) throw new Error("Không tải được danh sách yêu thích");
  return res.json();
}

export async function createWishlist(token: string, name: string): Promise<ApiWishlist> {
  const res = await fetch(`${API}/wishlist`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Không tạo được danh sách");
  return res.json();
}

export async function renameWishlist(
  token: string,
  id: string,
  name: string,
): Promise<ApiWishlist> {
  const res = await fetch(`${API}/wishlist/${id}`, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Không đổi tên được danh sách");
  return res.json();
}

export async function deleteWishlist(token: string, id: string): Promise<void> {
  const res = await fetch(`${API}/wishlist/${id}`, {
    method: "DELETE",
    headers: headers(token),
  });
  if (!res.ok && res.status !== 204) throw new Error("Không xóa được danh sách");
}

export async function addWishlistItem(
  token: string,
  productId: string,
  wishlistId: string,
): Promise<ApiWishlist> {
  const res = await fetch(`${API}/wishlist/items`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ productId, wishlistId }),
  });
  if (!res.ok) throw new Error("Không lưu được sản phẩm");
  return res.json();
}

export async function removeWishlistItem(token: string, itemId: string): Promise<void> {
  const res = await fetch(`${API}/wishlist/items/${itemId}`, {
    method: "DELETE",
    headers: headers(token),
  });
  if (!res.ok && res.status !== 204) throw new Error("Không xóa được sản phẩm");
}

// Shared in-flight guard so concurrent hook instances merge exactly once.
let mergePromise: Promise<boolean> | null = null;

/**
 * Push the guest's local lists into the logged-in account (idempotent on the BE),
 * then reset the local store. Resolves `true` if anything was merged (caller can
 * refetch only then). Named lists are matched by name (created if missing).
 */
export function mergeGuestWishlist(token: string): Promise<boolean> {
  if (mergePromise) return mergePromise;
  mergePromise = doMerge(token).finally(() => {
    mergePromise = null;
  });
  return mergePromise;
}

async function doMerge(token: string): Promise<boolean> {
  const local = useWishlistStore.getState().lists.filter((l) => l.items.length);
  if (!local.length) return false;

  const remote = await fetchWishlists(token);
  const remoteByName = new Map(remote.map((r) => [r.name.toLowerCase(), r]));

  for (const list of local) {
    // Match an existing account list by name, otherwise create it.
    const target = remoteByName.get(list.name.toLowerCase()) ?? null;
    const targetId = target?.id ?? (await createWishlist(token, list.name)).id;
    const already = new Set((target?.items ?? []).map((i) => i.product.id));
    for (const item of list.items) {
      if (already.has(item.id)) continue;
      await addWishlistItem(token, item.id, targetId);
    }
  }
  useWishlistStore.getState().reset();
  return true;
}
