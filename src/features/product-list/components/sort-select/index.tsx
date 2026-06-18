"use client";

import { useProductFilters } from "../../hooks/use-product-filters";

const OPTIONS: { value: string; label: string }[] = [
  { value: "relevance", label: "Liên quan" },
  { value: "newest", label: "Mới nhất" },
  { value: "best_selling", label: "Bán chạy" },
  { value: "price_asc", label: "Giá: thấp → cao" },
  { value: "price_desc", label: "Giá: cao → thấp" },
  { value: "rating", label: "Đánh giá cao" },
];

export function SortSelect() {
  const { get, setValue } = useProductFilters();
  const value = get("sort") || "relevance";

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden text-muted-foreground sm:inline">Sắp xếp</span>
      <select
        value={value}
        onChange={(e) => setValue("sort", e.target.value === "relevance" ? null : e.target.value)}
        className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
