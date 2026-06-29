import { env } from "@/config/env";
import type { Branch } from "@/types/branch";

/** Branch adapter → commerce BE (`GET /branches`, active branches only). */
interface ApiBranch {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  provinceCode?: string | null;
  phone?: string | null;
  isDefault?: boolean;
}

export async function getBranches(): Promise<Branch[]> {
  try {
    const res = await fetch(`${env.apiUrl}/branches`, {
      next: { revalidate: 300, tags: ["branches"] },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as ApiBranch[];
    return data.map((b) => ({
      id: b.id,
      name: b.name,
      address: b.address ?? "",
      city: b.city ?? "",
      provinceCode: b.provinceCode ?? undefined,
      phone: b.phone ?? null,
      isDefault: !!b.isDefault,
    }));
  } catch (err) {
    console.error("[branch] getBranches failed:", err);
    return [];
  }
}

/** The branch a visitor should land on before choosing — `isDefault`, else first. */
export function resolveDefaultBranch(branches: Branch[]): Branch | null {
  return branches.find((b) => b.isDefault) ?? branches[0] ?? null;
}
