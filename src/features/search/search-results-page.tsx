import Link from "next/link";
import { getProducts } from "@/services/product.service";
import { ProductGrid } from "@/features/product-list/components/product-grid";
import { Pagination } from "@/features/product-list/components/pagination";

export async function SearchResultsPage({ query, page }: { query: string; page: number }) {
  const term = query.trim();

  if (!term) {
    return (
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-16 text-center">
        <p className="text-base font-medium">Nhập từ khóa để tìm sản phẩm</p>
        <p className="mt-1 text-sm text-muted-foreground">Ví dụ: khoai lang, atiso, cà phê…</p>
      </main>
    );
  }

  const { items, pagination } = await getProducts({ search: term, page });
  const from = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const to = Math.min(pagination.page * pagination.pageSize, pagination.total);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:py-10">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Tìm kiếm
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-(--theme-heading-color,inherit) sm:text-3xl">
          Kết quả cho “{term}”
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{pagination.total} sản phẩm</p>
      </header>

      {pagination.total === 0 ? (
        <div className="flex min-h-[35vh] flex-col items-center justify-center gap-2 text-center">
          <p className="text-base font-medium">Không tìm thấy sản phẩm</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Thử từ khóa khác hoặc xem toàn bộ đặc sản.
          </p>
          <Link
            href="/c/dac-san"
            className="mt-2 text-sm font-medium text-primary hover:underline"
          >
            Xem đặc sản →
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-5 border-b border-border/60 pb-3 text-sm text-muted-foreground">
            Hiển thị <span className="font-medium text-foreground">{from}–{to}</span> trong{" "}
            {pagination.total} sản phẩm
          </div>
          <ProductGrid items={items} />
          <div className="mt-12">
            <Pagination page={pagination.page} totalPages={pagination.totalPages} />
          </div>
        </>
      )}
    </main>
  );
}
