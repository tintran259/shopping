import type { Branch } from "@/types/branch";

/**
 * BE branch adapter. The backend will expose `GET /branches` returning the
 * chain's physical stores. Until that endpoint exists this returns a small
 * mock list so the picker is usable; swap the body for the real fetch:
 *
 *   const res = await fetch(`${env.apiUrl}/branches`, { next: { revalidate: 3600 } });
 *   const json = await res.json();
 *   return json.data.map(toBranch);
 */
export async function getBranches(): Promise<Branch[]> {
  return MOCK_BRANCHES;
}

/** The branch a visitor should land on before choosing — `isDefault`, else first. */
export function resolveDefaultBranch(branches: Branch[]): Branch | null {
  return branches.find((b) => b.isDefault) ?? branches[0] ?? null;
}

/** Branch ids — used to seed per-branch product stock. */
export const BRANCH_IDS = ["hcm-q1", "hcm-q7", "hn-hk", "dn-hc"] as const;

const MOCK_BRANCHES: Branch[] = [
  {
    id: "hcm-q1",
    name: "Chi nhánh Quận 1",
    address: "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1",
    city: "TP. Hồ Chí Minh",
    provinceCode: "79",
    phone: "1900 1234",
    isDefault: true,
  },
  {
    id: "hcm-q7",
    name: "Chi nhánh Quận 7",
    address: "456 Nguyễn Thị Thập, Phường Tân Phú, Quận 7",
    city: "TP. Hồ Chí Minh",
    provinceCode: "79",
    phone: "1900 1235",
    isDefault: false,
  },
  {
    id: "hn-hk",
    name: "Chi nhánh Hoàn Kiếm",
    address: "78 Hàng Bài, Phường Tràng Tiền, Quận Hoàn Kiếm",
    city: "Hà Nội",
    provinceCode: "1",
    phone: "1900 1236",
    isDefault: false,
  },
  {
    id: "dn-hc",
    name: "Chi nhánh Hải Châu",
    address: "12 Trần Phú, Phường Hải Châu 1, Quận Hải Châu",
    city: "Đà Nẵng",
    provinceCode: "48",
    phone: "1900 1237",
    isDefault: false,
  },
];
