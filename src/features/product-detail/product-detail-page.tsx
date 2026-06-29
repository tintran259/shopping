import Link from "next/link";
import { CmsSlot } from "@/cms/renderer/cms-slot";
import { env } from "@/config/env";
import { getBranches } from "@/services/branch.service";
import type { Product, ProductAttribute, ProductSummary } from "@/types/product";
import { Gallery } from "./components/gallery";
import { ProductPurchase } from "./components/product-purchase";

/** schema.org Product JSON-LD — enables price/rating/availability rich results. */
function productJsonLd(p: Product) {
  const availability =
    p.status === "preorder"
      ? "https://schema.org/PreOrder"
      : p.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock";
  const url = `${env.siteUrl}/product/${p.slug}`;

  const offers = p.variants.length
    ? {
      "@type": "AggregateOffer",
      priceCurrency: p.price.currency,
      lowPrice: Math.min(...p.variants.map((v) => v.price.amount)),
      highPrice: Math.max(...p.variants.map((v) => v.price.amount)),
      offerCount: p.variants.length,
      availability,
      url,
    }
    : {
      "@type": "Offer",
      priceCurrency: p.price.currency,
      price: p.price.amount,
      availability,
      url,
    };

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    image: p.images.map((i) => i.url).filter(Boolean),
    description: p.shortDescription ?? p.description ?? p.name,
    sku: p.sku,
    ...(p.brand ? { brand: { "@type": "Brand", name: p.brand.name } } : {}),
    ...(p.categories[0] ? { category: p.categories[0].name } : {}),
    offers,
    ...(p.rating
      ? {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: p.rating.average,
          reviewCount: p.rating.count,
        },
      }
      : {}),
  };
}

function toSummary(p: Product): ProductSummary {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    thumbnail: p.images[0] ?? { url: "", alt: p.name },
    price: p.price,
    priceVaries: p.priceVaries,
    brand: p.brand,
    rating: p.rating,
    flags: p.flags,
    inStock: p.inStock,
    status: p.status,
    optionPreview: p.optionPreview,
    highlight: p.highlight,
  };
}

const attrValue = (a: ProductAttribute) =>
  Array.isArray(a.value) ? a.value.join(", ") : a.value;

export async function ProductDetailPage({ product }: { product: Product }) {
  const branches = await getBranches();
  const summary = toSummary(product);
  const cat = product.categories[0];

  const specs = [
    ...product.attributes.map((a) => ({ label: a.label, value: attrValue(a) })),
    ...(product.specifications ?? []),
  ];

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)) }}
      />

      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Trang chủ</Link>
        {cat && (
          <>
            <span>/</span>
            <Link href={`/c/${cat.slug}`} className="hover:text-foreground">{cat.name}</Link>
          </>
        )}
        <span>/</span>
        <span className="truncate text-foreground">{product.name}</span>
      </nav>

      <CmsSlot slot="pdp-top" />

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <Gallery images={product.images} name={product.name} />

        <div className="space-y-5">
          {product.brand && (
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {product.brand.name}
            </span>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-(--theme-heading-color,inherit) sm:text-3xl">
            {product.name}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            {product.rating && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <span aria-hidden className="text-(--theme-rating,#f59e0b)">★</span>
                <span className="font-medium text-foreground">{product.rating.average.toFixed(1)}</span>
                <span>({product.rating.count} đánh giá)</span>
              </span>
            )}
            <span className="text-muted-foreground">SKU: {product.sku}</span>
            {product.highlight && (
              <span className="rounded-full bg-(--theme-success,#059669) px-2 py-0.5 text-xs font-semibold text-white">
                {product.highlight}
              </span>
            )}
          </div>

          {product.shortDescription && (
            <p className="text-sm leading-relaxed text-muted-foreground">{product.shortDescription}</p>
          )}

          <ProductPurchase product={product} summary={summary} branches={branches} />
        </div>
      </div>

      {/* Description + specs */}
      <section className="mt-12 grid gap-10 lg:grid-cols-2">
        {specs.length > 0 && (
          <div>
            <h2 className="mb-4 text-lg font-semibold">Thông số</h2>
            <dl className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60">
              {specs.map((s, i) => (
                <div key={`${s.label}-${i}`} className="grid grid-cols-[40%_60%] gap-2 px-4 py-2.5 text-sm">
                  <dt className="text-muted-foreground">{s.label}</dt>
                  <dd className="font-medium">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <div>
          <h2 className="mb-4 text-lg font-semibold">Mô tả</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {product.description || product.shortDescription || "Đang cập nhật mô tả sản phẩm."}
          </p>
          <CmsSlot slot="pdp-content" />
        </div>
      </section>

      <CmsSlot slot="pdp-bottom" />
    </main>
  );
}
