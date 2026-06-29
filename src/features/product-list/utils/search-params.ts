import type { ProductListParams, ProductSort } from "@/types/product";

/**
 * URL searchParams <-> ProductListParams. The URL is the single source of truth
 * for PLP state (filters/sort/page) so it's shareable, SSR-friendly, and the
 * back button just works.
 *
 *   ?brand=aurora,lumen&color=Đen&region=Tây Bắc&min=100000&sort=price_asc&page=2
 *
 * Reserved params (q/sort/page/min/max) drive search/sort/paging/price; EVERY
 * other param is a generic facet selection (facetKey → values) — so a new facet
 * needs zero changes here.
 */

export type RawSearchParams = Record<string, string | string[] | undefined>;

// Reserved params drive search/sort/paging/price/branch — NOT generic facets.
// `branch` is the active-branch transport; it must not become a facet filter.
const RESERVED = new Set(["q", "sort", "page", "min", "max", "branch"]);

const SORTS: ProductSort[] = [
  "relevance",
  "newest",
  "price_asc",
  "price_desc",
  "best_selling",
  "rating",
];

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function csv(v: string | string[] | undefined): string[] {
  const s = first(v);
  return s ? s.split(",").map((x) => x.trim()).filter(Boolean) : [];
}

function num(v: string | string[] | undefined): number | undefined {
  const s = first(v);
  if (s == null || s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export function parseProductParams(
  sp: RawSearchParams,
  category?: string,
): ProductListParams {
  const sortRaw = first(sp.sort) as ProductSort | undefined;

  const filters: Record<string, string[]> = {};
  for (const [key, raw] of Object.entries(sp)) {
    if (RESERVED.has(key)) continue;
    const values = csv(raw);
    if (values.length) filters[key] = values;
  }

  return {
    category,
    page: num(sp.page) ?? 1,
    sort: sortRaw && SORTS.includes(sortRaw) ? sortRaw : "relevance",
    search: first(sp.q) || undefined,
    priceMin: num(sp.min),
    priceMax: num(sp.max),
    filters: Object.keys(filters).length ? filters : undefined,
  };
}

export function buildQueryString(params: ProductListParams): string {
  const sp = new URLSearchParams();
  if (params.search) sp.set("q", params.search);
  for (const [key, values] of Object.entries(params.filters ?? {})) {
    if (values.length) sp.set(key, values.join(","));
  }
  if (params.priceMin != null) sp.set("min", String(params.priceMin));
  if (params.priceMax != null) sp.set("max", String(params.priceMax));
  if (params.sort && params.sort !== "relevance") sp.set("sort", params.sort);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  return sp.toString();
}

/** Stable key for a param set — used to re-suspend the grid on any change. */
export function paramsKey(params: ProductListParams): string {
  return `${params.category ?? ""}?${buildQueryString(params)}`;
}

/** Count of active filters (drives the "Xóa lọc" / badge UI). */
export function activeFilterCount(params: ProductListParams): number {
  const facetCount = Object.values(params.filters ?? {}).reduce((n, v) => n + v.length, 0);
  return (
    facetCount +
    (params.priceMin != null ? 1 : 0) +
    (params.priceMax != null ? 1 : 0) +
    (params.search ? 1 : 0)
  );
}
