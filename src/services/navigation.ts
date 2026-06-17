import { getMenuNodes } from "@/cms/services/cms.service";
import { getCategoryTreeNodes } from "@/services/category.service";
import type { NavNode } from "@/types/navigation";

/**
 * Unified header navigation = CMS menu + BE category tree, all normalized to
 * `NavNode[]`. `position` orders a CMS menu group relative to the BE categories:
 *   start menus → BE category tree → end menus
 * Each source is isolated so one failing never blanks the whole menu.
 */
export async function getNavigation(): Promise<NavNode[]> {
  const [start, categories, end] = await Promise.all([
    getMenuNodes("start").catch(() => [] as NavNode[]),
    getCategoryTreeNodes().catch(() => [] as NavNode[]),
    getMenuNodes("end").catch(() => [] as NavNode[]),
  ]);
  return [...start, ...categories, ...end];
}
