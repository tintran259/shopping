import { env } from "@/config/env";
import type { NavNode } from "@/types/navigation";
import type { CategoryRef } from "@/types/product";

/**
 * Category adapter → commerce BE (`GET /categories`). Returns a flat list with
 * `parentId`; we expose both a flat `CategoryRef[]` (search) and a `NavNode[]`
 * tree (header nav, merged with CMS menu).
 */
interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

async function fetchCategories(): Promise<ApiCategory[]> {
  const res = await fetch(`${env.apiUrl}/categories`, {
    next: { revalidate: 300, tags: ["categories"] },
  });
  if (!res.ok) return [];
  return res.json() as Promise<ApiCategory[]>;
}

/** Flat list for search suggestions / refs. */
export async function getCategories(): Promise<CategoryRef[]> {
  return (await fetchCategories()).map((c) => ({ id: c.id, slug: c.slug, name: c.name }));
}

/** Build the unified nav tree from the flat category list (parentId → children). */
export async function getCategoryTreeNodes(): Promise<NavNode[]> {
  const cats = (await fetchCategories()).filter((c) => c.isActive !== false);
  const byParent = new Map<string | null, ApiCategory[]>();
  for (const c of cats) {
    const key = c.parentId ?? null;
    const list = byParent.get(key) ?? [];
    list.push(c);
    byParent.set(key, list);
  }
  const bySort = (a: ApiCategory, b: ApiCategory) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0);

  const toNode = (c: ApiCategory): NavNode => ({
    id: `cat-${c.id}`,
    label: c.name,
    url: `/c/${c.slug}`,
    openInNewTab: false,
    icon: null,
    highlight: false,
    featuredImage: c.imageUrl ? { src: c.imageUrl, alt: c.name } : null,
    children: (byParent.get(c.id) ?? []).sort(bySort).map(toNode),
    source: "category",
  });

  return (byParent.get(null) ?? []).sort(bySort).map(toNode);
}
