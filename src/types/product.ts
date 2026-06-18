/**
 * Product domain contract (storefront/BE owned — NOT CMS).
 *
 * Vertical-agnostic by design: the core (id/slug/name/price/images/rating/stock)
 * is the same whether you sell clothing, souvenirs, or food specialties. Anything
 * vertical-specific (color, region, certification, packaging…) is data, carried in
 * `attributes` + `options`, and surfaced through category-driven `Facet`s. The UI
 * renders from this config — it never hard-codes "color" or "size".
 *
 * Two shapes:
 *   - `ProductSummary` — light, for PLP cards / search / wishlist / related.
 *   - `Product`        — full, for the PDP only.
 *
 * Money: plain VND number (đồng, no decimals). `currency` defaults to "VND".
 */

// ── Primitives ──────────────────────────────────────────────────────────────

export interface ProductImage {
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface ProductPrice {
  /** Current selling price (for variant products: the lowest variant price). */
  amount: number;
  /** Original price (strikethrough) when on sale; null/undefined otherwise. */
  compareAt?: number | null;
  currency: string; // "VND"
}

export interface ProductRating {
  average: number; // 0–5
  count: number;
}

export interface BrandRef {
  id: string;
  slug: string;
  name: string;
}

export interface CategoryRef {
  id: string;
  slug: string;
  name: string;
}

export interface ProductFlags {
  isNew?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  isOnSale?: boolean;
}

export type ProductStatus = "active" | "draft" | "out_of_stock" | "preorder" | "discontinued";

/**
 * A vertical-specific, filterable/displayable property.
 *   clothing  → { key:"color",  label:"Màu",        value:"Đen" }
 *   specialty → { key:"region", label:"Vùng miền",  value:"Tây Bắc" }
 *               { key:"cert",   label:"Chứng nhận",  value:["OCOP 4★","VietGAP"] }
 */
export interface ProductAttribute {
  key: string;
  label: string;
  value: string | string[];
  group?: string;
}

// ── Variants ────────────────────────────────────────────────────────────────

/** How an option's values render: color dots / pills / a dropdown. */
export type OptionDisplayType = "swatch" | "pill" | "dropdown";

/** A variant axis, e.g. { name:"Quy cách", values:["200g","500g","1kg"] }. */
export interface ProductOption {
  id: string;
  name: string;
  values: string[];
  displayType: OptionDisplayType;
}

/** A concrete purchasable combination. Empty `variants` ⇒ a simple product. */
export interface ProductVariant {
  id: string;
  sku: string;
  /** Selected value per option name: { "Quy cách":"500g" }. */
  options: Record<string, string>;
  price: ProductPrice;
  stock: number;
  image?: ProductImage;
}

// ── Inventory (ties into the branch selector) ───────────────────────────────

export interface BranchStock {
  branchId: string;
  inStock: boolean;
  quantity?: number;
}

// ── Shapes ──────────────────────────────────────────────────────────────────

/** Compact preview of the primary variant axis, rendered on the card. */
export interface OptionPreview {
  name: string;
  displayType: OptionDisplayType;
  values: string[];
}

/** PLP / search / wishlist / related card. */
export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  thumbnail: ProductImage;
  price: ProductPrice;
  /** True when variant prices differ ⇒ show "Từ …". */
  priceVaries?: boolean;
  brand?: BrandRef | null;
  rating?: ProductRating;
  flags: ProductFlags;
  inStock: boolean;
  /** Availability state — drives the "Hết hàng" / "Đặt trước" badges. */
  status?: ProductStatus;
  /** Primary option preview (e.g. color swatches, or "3 quy cách"). */
  optionPreview?: OptionPreview;
  /** Small trust/context badge text, e.g. "OCOP 4★" or "Hội An". */
  highlight?: string;
}

/** PDP — the full product. Carries the summary fields plus full detail. */
export interface Product extends Omit<ProductSummary, "thumbnail"> {
  sku: string;
  images: ProductImage[];
  shortDescription?: string;
  description?: string;
  attributes: ProductAttribute[];
  specifications?: { label: string; value: string }[];
  options: ProductOption[];
  variants: ProductVariant[];
  categories: CategoryRef[];
  status: ProductStatus;
  branchStock?: BranchStock[];
  seo?: { title?: string; description?: string };
  createdAt?: string;
  updatedAt?: string;
}

// ── PLP query + result (data-driven filtering / facets) ──────────────────────

export type ProductSort =
  | "relevance"
  | "newest"
  | "price_asc"
  | "price_desc"
  | "best_selling"
  | "rating";

export interface ProductListParams {
  category?: string;
  page?: number;
  pageSize?: number;
  sort?: ProductSort;
  search?: string;
  priceMin?: number;
  priceMax?: number;
  /** Generic facet selections: facetKey → selected values. */
  filters?: Record<string, string[]>;
}

/** How a facet renders + filters. */
export type FacetType = "checkbox" | "swatch" | "range" | "rating";

export interface FacetOption {
  value: string;
  label: string;
  count: number;
}

/** A filterable dimension returned alongside results to build the filter UI. */
export interface Facet {
  key: string;
  label: string;
  type: FacetType;
  options?: FacetOption[];
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ProductListResult {
  items: ProductSummary[];
  pagination: Pagination;
  facets: Facet[];
}
