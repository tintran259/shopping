import { env } from "@/config/env";
import type {
  CategoryRef,
  Product,
  ProductListParams,
  ProductListResult,
  ProductReviewsResult,
  ProductSummary,
  ProductSort,
} from "@/types/product";
import { getCategories } from "@/services/category.service";

/**
 * Catalog adapter → the commerce BE (shopping-api). The BE already returns the
 * storefront shapes (`ProductSummary` / `Product` / `Facet`) with branch stock
 * folded in, so these are mostly thin fetches. See docs/backend-rules.md.
 */
const API = env.apiUrl;

/** Storefront sort token → BE `field:DIR` (BE sortable: createdAt|basePrice|name|ratingAvg). */
const SORT_MAP: Record<ProductSort, string> = {
  relevance: "createdAt:DESC",
  newest: "createdAt:DESC",
  price_asc: "basePrice:ASC",
  price_desc: "basePrice:DESC",
  best_selling: "ratingAvg:DESC",
  rating: "ratingAvg:DESC",
};

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").toLowerCase();

function buildQuery(params: ProductListParams): string {
  const qs = new URLSearchParams();
  qs.set("page", String(Math.max(1, params.page ?? 1)));
  if (params.pageSize) qs.set("limit", String(params.pageSize));
  if (params.category) qs.set("category", params.category);
  if (params.search) qs.set("q", params.search);
  if (params.sort) qs.set("sort", SORT_MAP[params.sort] ?? SORT_MAP.relevance);
  if (params.priceMin != null) qs.set("minPrice", String(params.priceMin));
  if (params.priceMax != null) qs.set("maxPrice", String(params.priceMax));
  if (params.branchId) qs.set("branchId", params.branchId);

  // Facet selections: `brand` → repeated brand params; everything else → `attrs`.
  const attrs: string[] = [];
  for (const [key, values] of Object.entries(params.filters ?? {})) {
    if (!values?.length) continue;
    if (key === "brand") values.forEach((v) => qs.append("brand", v));
    else values.forEach((v) => attrs.push(`${key}:${v}`));
  }
  if (attrs.length) qs.set("attrs", attrs.join(","));

  return qs.toString();
}

const emptyResult = (params: ProductListParams): ProductListResult => ({
  items: [],
  pagination: { page: params.page ?? 1, pageSize: params.pageSize ?? 0, total: 0, totalPages: 0 },
  facets: [],
});

export async function getProducts(params: ProductListParams = {}): Promise<ProductListResult> {
  try {
    const res = await fetch(`${API}/products?${buildQuery(params)}`, {
      next: { revalidate: 60, tags: ["products"] },
    });
    if (!res.ok) throw new Error(`products ${res.status}`);
    return (await res.json()) as ProductListResult;
  } catch (err) {
    // Catalog BE down → render an empty list instead of crashing the page.
    console.error("[catalog] getProducts failed:", err);
    return emptyResult(params);
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API}/products/slug/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60, tags: [`product:${slug}`] },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`product ${res.status}`);
    return (await res?.json()) as Product;
  } catch (err) {
    console.error("[catalog] getProductBySlug failed:", err);
    return null;
  }
}

export interface SearchSuggestions {
  products: ProductSummary[];
  categories: CategoryRef[];
  total: number;
}

export async function fetchProductReviews(
  slug: string,
  page = 1,
  limit = 10,
  star?: number,
): Promise<ProductReviewsResult> {
  const empty: ProductReviewsResult = { reviews: [], total: 0, average: 0, distribution: [] };
  try {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (star != null) qs.set("star", String(star));
    const res = await fetch(
      `${API}/products/${encodeURIComponent(slug)}/reviews?${qs}`,
      { cache: "no-store" },
    );
    if (!res.ok) throw new Error(`reviews ${res.status}`);
    return (await res.json()) as ProductReviewsResult;
  } catch (err) {
    console.error("[catalog] fetchProductReviews failed:", err);
    return empty;
  }
}

/** Submit a standalone product review (PENDING → admin approval).
 *  Requires Bearer token; `verified` badge will NOT appear (no linked order). */
export async function submitProductReview(
  productId: string,
  token: string,
  payload: {
    rating: number;
    comment?: string;
    tags?: string[];
    imageUrls?: string[];
  },
): Promise<void> {
  const res = await fetch(`${API}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ productId, ...payload }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err?.message) ? err.message[0] : (err?.message ?? "Gửi đánh giá thất bại");
    throw new Error(String(msg));
  }
}

/** Typeahead: top matching products (BE) + matching categories (filtered locally). */
export async function searchSuggestions(query: string, limit = 6): Promise<SearchSuggestions> {
  const q = query.trim();
  const empty: SearchSuggestions = { products: [], categories: [], total: 0 };
  if (q.length < 2) return empty;

  try {
    // Products (BE) + categories (cached) are independent — fetch in parallel.
    const [res, allCategories] = await Promise.all([
      fetch(`${API}/products?q=${encodeURIComponent(q)}&limit=${limit}`, {
        cache: "no-store",
      }),
      getCategories(),
    ]);
    if (!res.ok) return empty;
    const data = (await res.json()) as ProductListResult;

    const nq = normalize(q);
    const categories = allCategories
      .filter((c) => normalize(c.name).includes(nq))
      .slice(0, 4);

    return { products: data.items.slice(0, limit), categories, total: data.pagination.total };
  } catch (err) {
    console.error("[catalog] searchSuggestions failed:", err);
    return empty;
  }
}
