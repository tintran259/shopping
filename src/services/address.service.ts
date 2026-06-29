import { env } from "@/config/env";
import { useAddressStore, type UserAddress } from "@/store/address.store";

/**
 * Address-book BE integration (logged-in users). The BE stores administrative
 * codes (numeric) and resolves province/ward *names* itself; we map between that
 * and the storefront `UserAddress` (string codes + names). Guests use the local
 * Zustand store; on login `mergeGuestAddresses` pushes them into the account.
 */

const API = env.apiUrl;

export interface ApiAddress {
  id: string;
  label?: string | null;
  recipientName: string;
  phone: string;
  provinceCode: number;
  provinceName: string;
  wardCode: number;
  wardName: string;
  street: string;
  isDefault: boolean;
}

export type AddressInput = Omit<UserAddress, "id">;

const headers = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export function toUserAddress(a: ApiAddress): UserAddress {
  return {
    id: a.id,
    label: a.label ?? undefined,
    recipientName: a.recipientName,
    phone: a.phone,
    provinceCode: String(a.provinceCode),
    province: a.provinceName,
    wardCode: String(a.wardCode),
    ward: a.wardName,
    street: a.street,
    isDefault: a.isDefault,
  };
}

/** FE address → BE body. Names are dropped (the BE re-derives them from codes). */
function toBody(data: Partial<AddressInput>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (data.label !== undefined) body.label = data.label?.trim() || undefined;
  if (data.recipientName !== undefined) body.recipientName = data.recipientName.trim();
  if (data.phone !== undefined) body.phone = data.phone.trim();
  if (data.provinceCode) body.provinceCode = Number(data.provinceCode);
  if (data.wardCode) body.wardCode = Number(data.wardCode);
  if (data.street !== undefined) body.street = data.street.trim();
  if (data.isDefault !== undefined) body.isDefault = data.isDefault;
  return body;
}

export async function fetchAddresses(token: string): Promise<UserAddress[]> {
  const res = await fetch(`${API}/me/addresses`, { headers: headers(token) });
  if (!res.ok) throw new Error("Không tải được địa chỉ");
  const data: ApiAddress[] = await res.json();
  return data.map(toUserAddress);
}

export async function createAddress(token: string, data: AddressInput): Promise<UserAddress> {
  const res = await fetch(`${API}/me/addresses`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(toBody(data)),
  });
  if (!res.ok) throw new Error("Không lưu được địa chỉ");
  return toUserAddress(await res.json());
}

export async function updateAddress(
  token: string,
  id: string,
  patch: Partial<AddressInput>,
): Promise<UserAddress> {
  const res = await fetch(`${API}/me/addresses/${id}`, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify(toBody(patch)),
  });
  if (!res.ok) throw new Error("Không cập nhật được địa chỉ");
  return toUserAddress(await res.json());
}

export async function deleteAddress(token: string, id: string): Promise<void> {
  const res = await fetch(`${API}/me/addresses/${id}`, {
    method: "DELETE",
    headers: headers(token),
  });
  if (!res.ok && res.status !== 204) throw new Error("Không xóa được địa chỉ");
}

// Shared in-flight guard so concurrent hook instances merge exactly once.
let mergePromise: Promise<void> | null = null;

/** Push the guest's local addresses into the account once, then clear them. */
export function mergeGuestAddresses(token: string): Promise<void> {
  if (mergePromise) return mergePromise;
  mergePromise = doMerge(token).finally(() => {
    mergePromise = null;
  });
  return mergePromise;
}

async function doMerge(token: string): Promise<void> {
  const local = useAddressStore.getState().addresses;
  if (!local.length) return;
  for (const a of local) {
    await createAddress(token, a); // `id` is ignored by toBody
  }
  useAddressStore.getState().clear();
}
