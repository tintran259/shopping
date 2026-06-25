import { env } from "@/config/env";

/**
 * Vietnamese administrative divisions — served by our own backend (shopping-api),
 * which mirrors the 2025 **2-tier** model: Province → Ward (no district). Cascading:
 * pick a province to load its wards. The UI falls back to a simple province list +
 * free text if the API is unreachable.
 *
 * Endpoints: GET /locations/provinces · GET /locations/provinces/:code/wards
 */
const BASE = `${env.apiUrl}/locations`;

export interface AdminUnit {
  code: number;
  name: string;
}

// Static data → let the browser HTTP cache reuse it across reloads (pairs with the
// `Cache-Control` the BE sets on these endpoints).
export async function fetchProvinces(): Promise<AdminUnit[]> {
  const res = await fetch(`${BASE}/provinces`, { cache: "force-cache" });
  if (!res.ok) throw new Error("Không tải được danh sách tỉnh/thành");
  return res.json();
}

export async function fetchWards(provinceCode: number): Promise<AdminUnit[]> {
  const res = await fetch(`${BASE}/provinces/${provinceCode}/wards`, { cache: "force-cache" });
  if (!res.ok) throw new Error("Không tải được phường/xã");
  return res.json();
}
