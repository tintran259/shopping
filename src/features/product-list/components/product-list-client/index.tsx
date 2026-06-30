"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/services/product.service";
import { resolveDefaultBranch } from "@/services/branch.service";
import { useBranchStore } from "@/store/branch.store";
import type { Branch } from "@/types/branch";
import { activeFilterCount, paramsKey, parseProductParams } from "../../utils/search-params";
import { FilterControls } from "../filter-controls";
import { ActiveFilters } from "../active-filters";
import { SortSelect } from "../sort-select";
import { MobileFilterDrawer } from "../mobile-filter-drawer";
import { ProductGrid } from "../product-grid";
import { Pagination } from "../pagination";

/**
 * Client-rendered PLP body. Reads filter/sort/page + `branch` from the URL,
 * fetches via React Query (keyed on params + branch), and refetches when the
 * branch changes. CMS slots stay in the server wrapper.
 */
export function ProductListClient({
  category,
  title,
  branches,
}: {
  category: string;
  title: string;
  branches: Branch[];
}) {
  const searchParams = useSearchParams();
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  // Gate the (single) fetch on client mount so it runs with the resolved branch,
  // never branchless-then-branch.
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client mount gate
  useEffect(() => setMounted(true), []);

  // Resolve the branch synchronously: a valid URL/store UUID wins, else fall back
  // to the default branch (from the SSR list) — so the first fetch is already
  // branch-scoped and the header's default-heal becomes a no-op.
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const chosen = searchParams.get("branch") ?? selectedBranchId ?? "";
  const branchId = UUID_RE.test(chosen) ? chosen : resolveDefaultBranch(branches)?.id;

  const sp = Object.fromEntries(searchParams.entries());
  const params = { ...parseProductParams(sp, category), branchId };

  const { data, isLoading } = useQuery({
    queryKey: ["products", paramsKey(params), branchId ?? ""],
    queryFn: () => getProducts(params),
    enabled: mounted,
    // No placeholderData → switching branch/filter (uncached key) shows the
    // skeleton; revisiting a cached key stays instant.
    staleTime: 30_000,
  });
  const loading = !mounted || isLoading;

  const facets = data?.facets ?? [];
  const items = data?.items ?? [];
  const pagination = data?.pagination ?? {
    page: params.page ?? 1,
    pageSize: 0,
    total: 0,
    totalPages: 0,
  };
  const activeCount = activeFilterCount(params);
  const from = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const to = Math.min(pagination.page * pagination.pageSize, pagination.total);

  return (
    <>
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Bộ sưu tập
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-(--theme-heading-color,inherit) sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {loading ? "Đang tải…" : `${pagination.total} sản phẩm · giao nhanh toàn quốc`}
        </p>
      </header>

      <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-10">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl bg-(--theme-sidebar-background,transparent) p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold">Bộ lọc</span>
            </div>
            <FilterControls facets={facets} />
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-4 flex items-center gap-3">
            <MobileFilterDrawer facets={facets} activeCount={activeCount} />
            <div className="ml-auto">
              <SortSelect />
            </div>
          </div>

          {activeCount > 0 && (
            <div className="mb-4">
              <ActiveFilters facets={facets} />
            </div>
          )}

          <div className="mb-5 flex items-center justify-between border-b border-border/60 pb-3 text-sm text-muted-foreground">
            <span>
              {loading ? (
                "Đang tải sản phẩm…"
              ) : (
                <>
                  Hiển thị <span className="font-medium text-foreground">{from}–{to}</span> trong{" "}
                  {pagination.total} sản phẩm
                </>
              )}
            </span>
            {!loading && pagination.totalPages > 0 && (
              <span className="hidden sm:inline">
                Trang {pagination.page}/{pagination.totalPages}
              </span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="aspect-4/5 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex min-h-[30vh] flex-col items-center justify-center gap-2 text-center">
              <p className="text-base font-medium">Không có sản phẩm</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Thử bỏ bớt bộ lọc hoặc chọn chi nhánh khác.
              </p>
            </div>
          ) : (
            <ProductGrid items={items} />
          )}

          <div className="mt-12">
            <Pagination page={pagination.page} totalPages={pagination.totalPages} />
          </div>
        </section>
      </div>
    </>
  );
}
