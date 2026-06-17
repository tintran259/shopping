import type { NavNode } from "@/types/navigation";

/**
 * BE catalog adapter. The backend will expose `GET /categories/tree` returning
 * Attribute → Category → Category Item (3 levels). Map it into the SAME unified
 * `NavNode[]` so the header/merge never change.
 *
 * Stub until the BE endpoint exists — returns []. When ready:
 *   const tree = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/tree`)...
 *   return tree.map((attr) => attributeToNode(attr));  // source: "category"
 */
export async function getCategoryTreeNodes(): Promise<NavNode[]> {
  return [];
}
