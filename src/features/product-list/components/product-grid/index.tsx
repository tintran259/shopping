import type { ProductSummary } from "@/types/product";
import { ProductCard } from "../product-card";
import { ProductCardSkeleton } from "../product-card/skeleton";

const GRID = "grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

export function ProductGrid({ items }: { items: ProductSummary[] }) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
        <p className="text-base font-medium">Không tìm thấy sản phẩm</p>
        <p className="text-sm text-muted-foreground">
          Thử bỏ bớt bộ lọc hoặc tìm với từ khóa khác.
        </p>
      </div>
    );
  }

  return (
    <div className={GRID}>
      {items.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className={GRID}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
