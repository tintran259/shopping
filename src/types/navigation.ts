/**
 * Unified navigation DTO — the SINGLE shape the header renders, regardless of
 * source. Both adapters normalize into `NavNode[]`:
 *   - CMS `menu` (Strapi)            → cms.service `getMenuNodes()`
 *   - BE `/categories/tree` (later)  → category.service `getCategoryTreeNodes()`
 *
 * Three levels, matching the agreed structure:
 *   L1 (top-bar item) → children = L2 (mega-menu columns) → children = L3 (links)
 */
export interface NavImage {
  src: string;
  alt: string;
}

export interface NavNode {
  /** Stable, source-prefixed id (e.g. "cms-2", "cat-A1"). */
  id: string;
  label: string;
  /** Resolved href (manual url or /p/<slug>); null = not linkable. */
  url: string | null;
  openInNewTab: boolean;
  /** Optional icon name / emoji (CMS only). */
  icon: string | null;
  /** Render with emphasis (e.g. a "Sale" item). */
  highlight: boolean;
  /** Mega-menu featured image (usually only on L1). */
  featuredImage: NavImage | null;
  children: NavNode[];
  source: "cms" | "category";
}
