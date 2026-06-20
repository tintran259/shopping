/**
 * Vietnamese administrative divisions (province → district → ward) from the public
 * open API. Cascading: pick a province to load its districts, a district to load its
 * wards. Consumers fetch via React Query (see `hooks/use-location`); the UI falls back
 * to a simple province list + free text if the API is unreachable.
 *
 * API: https://provinces.open-api.vn
 */
const BASE = "https://provinces.open-api.vn/api";

export interface AdminUnit {
  code: number;
  name: string;
}

export async function fetchProvinces(): Promise<AdminUnit[]> {
  const res = await fetch(`${BASE}/p/`);
  if (!res.ok) throw new Error("Không tải được danh sách tỉnh/thành");
  return res.json();
}

export async function fetchDistricts(provinceCode: number): Promise<AdminUnit[]> {
  const res = await fetch(`${BASE}/p/${provinceCode}?depth=2`);
  if (!res.ok) throw new Error("Không tải được quận/huyện");
  const data = (await res.json()) as { districts?: AdminUnit[] };
  return data.districts ?? [];
}

export async function fetchWards(districtCode: number): Promise<AdminUnit[]> {
  const res = await fetch(`${BASE}/d/${districtCode}?depth=2`);
  if (!res.ok) throw new Error("Không tải được phường/xã");
  const data = (await res.json()) as { wards?: AdminUnit[] };
  return data.wards ?? [];
}
