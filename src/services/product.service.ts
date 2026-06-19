import { BRANCH_IDS } from "@/services/branch.service";
import type {
  BranchStock,
  BrandRef,
  CategoryRef,
  Facet,
  FacetType,
  Product,
  ProductAttribute,
  ProductListParams,
  ProductListResult,
  ProductOption,
  ProductSummary,
  ProductVariant,
} from "@/types/product";

/** Accent/diacritic-insensitive normalizer for Vietnamese search. */
function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

/**
 * BE catalog adapter. The backend will expose `GET /products` (list, with
 * filter/sort/pagination/facets) and `GET /products/:slug` (detail). Until then
 * this serves a deterministic, MULTI-VERTICAL in-memory catalog so PLP/PDP are
 * buildable across clothing, souvenirs, and food specialties.
 *
 * Nothing here is vertical-specific in the UI sense: each category declares its
 * own facets (`VERTICAL_FACETS`), and products carry generic `attributes` +
 * `options`. Swap-in later by replacing the MOCK bodies; keep the contract.
 */

const CURRENCY = "VND";
const PAGE_SIZE = 12;

type Vertical = "fashion" | "souvenir" | "specialty";

/** A facet definition: where to read the value from + how it renders. */
interface FacetDef {
  key: string;
  label: string;
  type: FacetType;
  source: "brand" | "attribute" | "option";
}

/** Per-vertical filter config — the only place "what's filterable" is declared. */
const VERTICAL_FACETS: Record<Vertical, FacetDef[]> = {
  fashion: [
    { key: "brand", label: "Thương hiệu", type: "checkbox", source: "brand" },
    { key: "color", label: "Màu sắc", type: "swatch", source: "attribute" },
    { key: "size", label: "Kích thước", type: "checkbox", source: "option" },
    { key: "price", label: "Khoảng giá", type: "range", source: "attribute" },
  ],
  souvenir: [
    { key: "brand", label: "Nhà cung cấp", type: "checkbox", source: "brand" },
    { key: "material", label: "Chất liệu", type: "checkbox", source: "attribute" },
    { key: "origin", label: "Xuất xứ", type: "checkbox", source: "attribute" },
    { key: "price", label: "Khoảng giá", type: "range", source: "attribute" },
  ],
  specialty: [
    { key: "brand", label: "Cơ sở sản xuất", type: "checkbox", source: "brand" },
    { key: "region", label: "Vùng miền", type: "checkbox", source: "attribute" },
    { key: "cert", label: "Chứng nhận", type: "checkbox", source: "attribute" },
    { key: "weight", label: "Quy cách", type: "checkbox", source: "option" },
    { key: "price", label: "Khoảng giá", type: "range", source: "attribute" },
  ],
};

interface CategoryDef extends CategoryRefLike {
  vertical: Vertical;
}
type CategoryRefLike = { id: string; slug: string; name: string };

const CATEGORIES: CategoryDef[] = [
  { id: "c1", slug: "ao-thun", name: "Áo thun", vertical: "fashion" },
  { id: "c2", slug: "giay", name: "Giày", vertical: "fashion" },
  { id: "c3", slug: "qua-luu-niem", name: "Quà lưu niệm", vertical: "souvenir" },
  { id: "c4", slug: "dac-san", name: "Đặc sản", vertical: "specialty" },
];

const BRANDS: Record<Vertical, BrandRef[]> = {
  fashion: [
    { id: "f1", slug: "aurora", name: "Aurora" },
    { id: "f2", slug: "lumen", name: "Lumen" },
    { id: "f3", slug: "northpeak", name: "NorthPeak" },
  ],
  souvenir: [
    { id: "s1", slug: "nha-go", name: "Nhà Gỗ" },
    { id: "s2", slug: "gom-bat-trang", name: "Gốm Bát Tràng" },
    { id: "s3", slug: "may-tre-viet", name: "Mây Tre Việt" },
  ],
  specialty: [
    { id: "d1", slug: "latas-dalat", name: "LATA'S Đà Lạt" },
    { id: "d2", slug: "htx-cau-dat", name: "HTX Cầu Đất" },
    { id: "d3", slug: "vuon-dau-da-lat", name: "Vườn Dâu Đà Lạt" },
  ],
};

// Attribute / option value pools per vertical.
const FASHION = { colors: ["Đen", "Trắng", "Xanh", "Đỏ", "Be"], sizes: ["S", "M", "L", "XL"], materials: ["Cotton", "Linen", "Kaki"] };
const SOUVENIR = { materials: ["Gỗ", "Gốm", "Mây tre", "Vải"], origins: ["Hà Nội", "Hội An", "Huế", "Đà Lạt"] };

/**
 * Đặc sản Đà Lạt seed — real product photos from the LATA'S DALAT shop (Shopee
 * image CDN). Only "Khoai lang sấy dẻo" is image-confirmed; the rest reuse those
 * 6 photos against plausible Đà Lạt specialties. Replace with BE media later.
 */
const SU = "https://down-vn.img.susercontent.com/file/";
const IMG = {
  khoai: SU + "vn-11134207-81ztc-mn8d3mybh5ag17",
  mutDau: SU + "vn-11134207-81ztc-mn2nlhcrpcso28",
  hong: SU + "vn-11134207-81ztc-mn6zrd0zzpqe34",
  dauTay: SU + "vn-11134207-81ztc-mn13pkt3l4as2c",
  macca: SU + "vn-11134207-81ztc-mn6of31w7hfo84",
  caphe: SU + "vn-11134207-81ztc-mn2p5ygzvev4d7",
};
const IMG_POOL = [IMG.khoai, IMG.mutDau, IMG.hong, IMG.dauTay, IMG.macca, IMG.caphe];

interface DalatPreset {
  slug: string;
  name: string;
  img: string;
  region: string;
  cert?: string;
  flavor?: string;
  /** Quy cách: >1 ⇒ variant product; exactly 1 ⇒ simple product. */
  weights: string[];
  /** Price of the smallest quy cách (đồng). */
  base: number;
}

const DALAT_SPECIALTIES: DalatPreset[] = [
  { slug: "khoai-lang-say-deo", name: "Khoai lang sấy dẻo", img: IMG.khoai, region: "Đà Lạt", cert: "OCOP 3★", flavor: "Ngọt", weights: ["250g", "500g", "1kg"], base: 65_000 },
  { slug: "mut-dau-tay-deo", name: "Mứt dâu tây dẻo", img: IMG.mutDau, region: "Đà Lạt", cert: "OCOP 3★", flavor: "Chua ngọt", weights: ["250g", "500g", "Hộp quà"], base: 85_000 },
  { slug: "hong-treo-gio", name: "Hồng treo gió", img: IMG.hong, region: "Đà Lạt", cert: "OCOP 4★", flavor: "Ngọt", weights: ["500g", "1kg"], base: 220_000 },
  { slug: "dau-tay-say-deo", name: "Dâu tây sấy dẻo", img: IMG.dauTay, region: "Đà Lạt", cert: "VietGAP", flavor: "Chua ngọt", weights: ["100g", "250g", "500g"], base: 75_000 },
  { slug: "hat-mac-ca", name: "Hạt mắc ca", img: IMG.macca, region: "Lâm Đồng", cert: "VietGAP", flavor: "Bùi", weights: ["250g", "500g", "1kg"], base: 120_000 },
  { slug: "ca-phe-cau-dat", name: "Cà phê Cầu Đất (Arabica)", img: IMG.caphe, region: "Cầu Đất", cert: "OCOP 4★", flavor: "Đắng", weights: ["250g", "500g", "1kg"], base: 110_000 },
  { slug: "tra-atiso-tui-loc", name: "Trà atiso túi lọc", img: IMG.khoai, region: "Đà Lạt", cert: "OCOP 3★", flavor: "Thanh mát", weights: ["Hộp 20 túi", "Hộp 50 túi"], base: 55_000 },
  { slug: "cao-atiso", name: "Cao atiso nguyên chất", img: IMG.mutDau, region: "Đà Lạt", cert: "OCOP 4★", flavor: "Thanh mát", weights: ["200g", "500g"], base: 140_000 },
  { slug: "mut-hong-deo", name: "Mứt hồng dẻo", img: IMG.hong, region: "Đà Lạt", cert: "OCOP 3★", flavor: "Ngọt", weights: ["250g", "500g"], base: 115_000 },
  { slug: "tra-oolong-cau-dat", name: "Trà oolong Cầu Đất", img: IMG.caphe, region: "Cầu Đất", cert: "OCOP 4★", flavor: "Thanh mát", weights: ["100g", "250g"], base: 130_000 },
  { slug: "ruou-vang-da-lat", name: "Rượu vang Đà Lạt", img: IMG.dauTay, region: "Đà Lạt", flavor: "Chát nhẹ", weights: ["Chai 750ml"], base: 180_000 },
];

/** Tiny seeded PRNG so the catalog is stable across renders/builds. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function pick<T>(arr: T[], r: () => number): T {
  return arr[Math.floor(r() * arr.length)];
}

const round1k = (n: number) => Math.round(n / 1000) * 1000;

function buildProduct(cat: CategoryDef, i: number, preset?: DalatPreset): Product {
  const r = rng((CATEGORIES.indexOf(cat) + 1) * 100 + i);
  const brand = pick(BRANDS[cat.vertical], r);
  const onSale = r() > 0.5;
  const idx = String(i + 1).padStart(2, "0");

  // Deterministic edge-state coverage so the PLP exercises every state.
  const forcedOOS = i % 6 === 2;
  const isPreorder = !forcedOOS && i % 13 === 9;
  const stock = forcedOOS || r() <= 0.12 ? 0 : Math.ceil(r() * 40);
  const noImage = i % 9 === 4;
  const noRating = i % 8 === 3;
  const noBrand = cat.vertical !== "specialty" && i % 13 === 6;
  const longName = i % 11 === 7;

  const attributes: ProductAttribute[] = [];
  const options: ProductOption[] = [];
  const variants: ProductVariant[] = [];
  let optionPreviewKey = "";
  let name: string;
  let slug: string;
  let basePrice: number;

  if (cat.vertical === "specialty" && preset) {
    const cycle = Math.floor(i / DALAT_SPECIALTIES.length);
    slug = cycle === 0 ? preset.slug : `${preset.slug}-${cycle + 1}`;
    name = cycle === 0 ? preset.name : `${preset.name} #${cycle + 1}`;
    basePrice = preset.base;
    attributes.push({ key: "region", label: "Vùng miền", value: preset.region });
    if (preset.cert) attributes.push({ key: "cert", label: "Chứng nhận", value: preset.cert });
    if (preset.flavor) attributes.push({ key: "flavor", label: "Hương vị", value: preset.flavor });

    if (preset.weights.length > 1) {
      // Variant product — sold by quy cách, each its own price.
      options.push({ id: "opt-weight", name: "Quy cách", values: preset.weights, displayType: "pill" });
      optionPreviewKey = "Quy cách";
      preset.weights.forEach((w, vi) => {
        const vPrice = round1k(basePrice * (1 + vi * 0.7));
        variants.push({
          id: `${slug}-v${vi}`,
          sku: `${slug}-${w}`,
          options: { "Quy cách": w },
          price: { amount: vPrice, compareAt: onSale ? round1k(vPrice * 1.25) : null, currency: CURRENCY },
          // Some quy cách run out of stock so the PDP can exercise per-variant OOS.
          stock: r() < 0.18 ? 0 : Math.ceil(r() * 30),
        });
      });
    } else {
      // Simple product (e.g. a 750ml bottle) — single price, no options.
      attributes.push({ key: "package", label: "Quy cách", value: preset.weights[0] });
    }
  } else {
    // fashion / souvenir — generic placeholder catalog.
    basePrice = 80_000 + Math.round(r() * 40) * 15_000; // 80k–680k
    slug = `${cat.slug}-${brand.slug}-${i + 1}`;
    name = `${cat.name} ${brand.name} ${idx}`;
    if (cat.vertical === "fashion") {
      attributes.push({ key: "color", label: "Màu sắc", value: FASHION.colors });
      attributes.push({ key: "material", label: "Chất liệu", value: pick(FASHION.materials, r) });
      options.push({ id: "opt-color", name: "Màu sắc", values: FASHION.colors, displayType: "swatch" });
      options.push({ id: "opt-size", name: "Kích thước", values: FASHION.sizes, displayType: "pill" });
      optionPreviewKey = "Màu sắc";
    } else {
      attributes.push({ key: "material", label: "Chất liệu", value: pick(SOUVENIR.materials, r) });
      attributes.push({ key: "origin", label: "Xuất xứ", value: pick(SOUVENIR.origins, r) });
    }
  }

  if (longName) name = `${name} — phiên bản giới hạn đặc biệt, mẫu mới ${idx}`;

  // Multiple images so the PDP gallery has thumbnails. noImage → empty (placeholder);
  // specialty → real Shopee photos (preset first); generic → several picsum seeds.
  const urls = noImage
    ? [""]
    : preset
      ? [preset.img, ...IMG_POOL.filter((u) => u !== preset.img)].slice(0, 4)
      : // first item of each generic category gets 24 images to exercise the gallery
        Array.from({ length: i === 0 ? 24 : 4 }, (_, n) => `https://picsum.photos/seed/${slug}-${n + 1}/600/750`);
  const images = urls.map((url, n) => ({
    url,
    alt: `${name} - ảnh ${n + 1}`,
    width: 600,
    height: 750,
  }));

  // Card price = lowest variant price (or the simple base price).
  const priceAmount = variants.length ? Math.min(...variants.map((v) => v.price.amount)) : basePrice;
  const compareAt = onSale ? round1k(priceAmount * 1.25) : null;
  const priceVaries = variants.length > 0 && new Set(variants.map((v) => v.price.amount)).size > 1;
  // Variant products are in stock if ANY variant has stock; else use the simple flag.
  const variantInStock = variants.length ? variants.some((v) => v.stock > 0) : stock > 0;

  // Per-branch availability. If the product is out of stock overall, every branch
  // is out; otherwise each branch is randomly stocked but at least one carries it.
  const branchStock: BranchStock[] = BRANCH_IDS.map((branchId) => {
    const ok = variantInStock && r() > 0.4;
    return { branchId, inStock: ok, quantity: ok ? Math.ceil(r() * 20) : 0 };
  });
  if (variantInStock && !branchStock.some((b) => b.inStock)) {
    branchStock[0] = { branchId: BRANCH_IDS[0], inStock: true, quantity: Math.ceil(r() * 20) + 1 };
  }

  return {
    id: slug,
    slug,
    sku: `SKU-${slug}`,
    name,
    brand: noBrand ? null : brand,
    price: { amount: priceAmount, compareAt, currency: CURRENCY },
    priceVaries,
    images,
    shortDescription:
      cat.vertical === "specialty"
        ? `${name} — đặc sản Đà Lạt, tự nhiên từ đất, ngọt lành từ tâm.`
        : `${name} — chất lượng tuyển chọn.`,
    rating: noRating
      ? undefined
      : { average: Math.round((3.5 + r() * 1.5) * 10) / 10, count: Math.ceil(r() * 200) },
    flags: { isNew: i % 7 === 0, isBestSeller: i % 4 === 0, isFeatured: i % 11 === 0, isOnSale: onSale },
    inStock: isPreorder ? true : variantInStock,
    status: isPreorder ? "preorder" : variantInStock ? "active" : "out_of_stock",
    attributes,
    options,
    variants,
    branchStock,
    categories: [{ id: cat.id, slug: cat.slug, name: cat.name }],
    optionPreview: optionPreviewKey
      ? {
          name: optionPreviewKey,
          displayType: options.find((o) => o.name === optionPreviewKey)!.displayType,
          values: options.find((o) => o.name === optionPreviewKey)!.values,
        }
      : undefined,
    highlight: cat.vertical === "specialty" ? preset?.cert : undefined,
  };
}

const GENERIC_COUNT = 34; // per fashion/souvenir category
const SPECIALTY_COUNT = 36; // cycles through DALAT_SPECIALTIES presets

function buildCatalog(): Product[] {
  const out: Product[] = [];
  for (const cat of CATEGORIES) {
    if (cat.vertical === "specialty") {
      for (let i = 0; i < SPECIALTY_COUNT; i++) {
        out.push(buildProduct(cat, i, DALAT_SPECIALTIES[i % DALAT_SPECIALTIES.length]));
      }
    } else {
      for (let i = 0; i < GENERIC_COUNT; i++) out.push(buildProduct(cat, i));
    }
  }
  return out;
}

const CATALOG = buildCatalog();

/** Read a product's value(s) for a facet, per its declared source. */
function valuesFor(p: Product, def: FacetDef): string[] {
  if (def.source === "brand") return p.brand ? [p.brand.slug] : [];
  if (def.source === "option") {
    const opt = p.options.find((o) => o.name === def.label || o.id === `opt-${def.key}`);
    return opt?.values ?? [];
  }
  const attr = p.attributes.find((a) => a.key === def.key);
  if (!attr) return [];
  return Array.isArray(attr.value) ? attr.value : [attr.value];
}

/** Label for a facet option value (brand slug → brand name; else identity). */
function labelFor(def: FacetDef, value: string, scoped: Product[]): string {
  if (def.source === "brand") {
    return scoped.find((p) => p.brand?.slug === value)?.brand?.name ?? value;
  }
  return value;
}

function buildFacets(scoped: Product[], defs: FacetDef[]): Facet[] {
  return defs
    .filter((d) => d.type !== "range")
    .map((def) => {
      const counts = new Map<string, number>();
      for (const p of scoped) {
        for (const v of valuesFor(p, def)) counts.set(v, (counts.get(v) ?? 0) + 1);
      }
      const options = [...counts.entries()]
        .map(([value, count]) => ({ value, label: labelFor(def, value, scoped), count }))
        .sort((a, b) => b.count - a.count);
      return { key: def.key, label: def.label, type: def.type, options };
    })
    .filter((f) => (f.options?.length ?? 0) > 0);
}

function sortItems(items: Product[], sort: ProductListParams["sort"]): Product[] {
  const arr = [...items];
  switch (sort) {
    case "price_asc":
      return arr.sort((a, b) => a.price.amount - b.price.amount);
    case "price_desc":
      return arr.sort((a, b) => b.price.amount - a.price.amount);
    case "rating":
      return arr.sort((a, b) => (b.rating?.average ?? 0) - (a.rating?.average ?? 0));
    case "best_selling":
      return arr.sort((a, b) => (b.rating?.count ?? 0) - (a.rating?.count ?? 0));
    case "newest":
      return arr.sort((a, b) => Number(b.flags.isNew) - Number(a.flags.isNew));
    default:
      return arr;
  }
}

function toSummary(p: Product): ProductSummary {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    thumbnail: p.images[0],
    price: p.price,
    priceVaries: p.priceVaries,
    brand: p.brand,
    rating: p.rating,
    flags: p.flags,
    inStock: p.inStock,
    branchStock: p.branchStock,
    status: p.status,
    optionPreview: p.optionPreview,
    highlight: p.highlight,
  };
}

export async function getProducts(params: ProductListParams = {}): Promise<ProductListResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? PAGE_SIZE;

  const cat = CATEGORIES.find((c) => c.slug === params.category);
  const defs = cat ? VERTICAL_FACETS[cat.vertical] : VERTICAL_FACETS.fashion;

  // Scope to category first — facets reflect the full category.
  const scoped = params.category
    ? CATALOG.filter((p) => p.categories.some((c) => c.slug === params.category))
    : CATALOG;

  let filtered = scoped;
  if (params.search) {
    const q = normalize(params.search);
    filtered = filtered.filter((p) => normalize(p.name).includes(q));
  }
  // Generic facet filters: every selected value must match (AND across facets).
  for (const [key, selected] of Object.entries(params.filters ?? {})) {
    if (!selected.length) continue;
    const def = defs.find((d) => d.key === key);
    if (!def) continue;
    filtered = filtered.filter((p) => {
      const vals = valuesFor(p, def);
      return selected.some((s) => vals.includes(s));
    });
  }
  if (params.priceMin != null) filtered = filtered.filter((p) => p.price.amount >= params.priceMin!);
  if (params.priceMax != null) filtered = filtered.filter((p) => p.price.amount <= params.priceMax!);

  const sorted = sortItems(filtered, params.sort);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const items = sorted.slice(start, start + pageSize).map(toSummary);

  return {
    items,
    pagination: { page, pageSize, total, totalPages },
    facets: buildFacets(scoped, defs),
  };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return CATALOG.find((p) => p.slug === slug) ?? null;
}

export interface SearchSuggestions {
  products: ProductSummary[];
  categories: CategoryRef[];
  total: number;
}

/** Typeahead suggestions: top matching products + matching categories. */
export async function searchSuggestions(
  query: string,
  limit = 6,
): Promise<SearchSuggestions> {
  const q = normalize(query);
  if (q.length < 2) return { products: [], categories: [], total: 0 };

  const matched = CATALOG.filter((p) => normalize(p.name).includes(q));
  const categories: CategoryRef[] = CATEGORIES.filter((c) => normalize(c.name).includes(q)).map(
    (c) => ({ id: c.id, slug: c.slug, name: c.name }),
  );

  return {
    products: matched.slice(0, limit).map(toSummary),
    categories,
    total: matched.length,
  };
}
