import { getProducts } from "@/services/product.service";
import type { ProductListParams } from "@/types/product";
import { CmsSlot } from "@/cms/renderer/cms-slot";
import { activeFilterCount } from "./utils/search-params";
import { FilterControls } from "./components/filter-controls";
import { ActiveFilters } from "./components/active-filters";
import { SortSelect } from "./components/sort-select";
import { MobileFilterDrawer } from "./components/mobile-filter-drawer";
import { ProductGrid } from "./components/product-grid";
import { Pagination } from "./components/pagination";

/** PLP layout: hero header → toolbar → [desktop sidebar | grid] → pagination. */
export async function ProductListPage({
  title,
  params,
}: {
  title: string;
  params: ProductListParams;
}) {
  const { items, pagination, facets } = await getProducts(params);
  const activeCount = activeFilterCount(params);

  const from = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const to = Math.min(pagination.page * pagination.pageSize, pagination.total);

  return (
    <main id="plp-top" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:py-10">
      {/* CMS slot — top of the PLP (campaign banner, SEO intro, …) */}
      <CmsSlot slot="plp-top" />

      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Bộ sưu tập
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-(--theme-heading-color,inherit) sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {pagination.total} sản phẩm · giao nhanh toàn quốc
        </p>
      </header>

      <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-10">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl bg-(--theme-sidebar-background,transparent) p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold">Bộ lọc</span>
            </div>
            <FilterControls facets={facets} />
          </div>
        </aside>

        <section className="min-w-0">
          {/* Toolbar — filter trigger + sort */}
          <div className="mb-4 flex items-center gap-3">
            <MobileFilterDrawer facets={facets} activeCount={activeCount} />
            <div className="ml-auto">
              <SortSelect />
            </div>
          </div>

          {/* Filter section sits ABOVE the result count */}
          {activeCount > 0 && (
            <div className="mb-4">
              <ActiveFilters facets={facets} />
            </div>
          )}

          {/* Result count — right above the grid */}
          <div className="mb-5 flex items-center justify-between border-b border-border/60 pb-3 text-sm text-muted-foreground">
            <span>
              Hiển thị <span className="font-medium text-foreground">{from}–{to}</span> trong{" "}
              {pagination.total} sản phẩm
            </span>
            <span className="hidden sm:inline">
              Trang {pagination.page}/{pagination.totalPages}
            </span>
          </div>

          <ProductGrid items={items} />

          <div className="mt-12">
            <Pagination page={pagination.page} totalPages={pagination.totalPages} />
          </div>
        </section>
      </div>

      {/* CMS slot — bottom of the PLP (SEO copy, related collections, …) */}
      <CmsSlot slot="plp-bottom" />
    </main>
  );
}
