"use client";

import { formatPrice } from "@/lib/pricing";
import type { Facet } from "@/types/product";
import { useProductFilters } from "../../hooks/use-product-filters";

type Chip = { key: string; label: string; remove: () => void };

/** Removable chips for every active selection — derived generically from facets. */
export function ActiveFilters({ facets }: { facets: Facet[] }) {
  const { getList, get, toggleInList, setValue, setMany, clearAll } = useProductFilters();

  const chips: Chip[] = [];

  for (const facet of facets) {
    const optLabel = (value: string) =>
      facet.options?.find((o) => o.value === value)?.label ?? value;
    for (const value of getList(facet.key)) {
      chips.push({
        key: `${facet.key}-${value}`,
        label: optLabel(value),
        remove: () => toggleInList(facet.key, value),
      });
    }
  }

  const min = get("min");
  const max = get("max");
  if (min || max) {
    const label = `${min ? formatPrice(Number(min)) : "0₫"} – ${max ? formatPrice(Number(max)) : "∞"}`;
    chips.push({ key: "price", label, remove: () => setMany({ min: null, max: null }) });
  }

  const q = get("q");
  if (q) chips.push({ key: "q", label: `“${q}”`, remove: () => setValue("q", null) });

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button
          key={c.key}
          onClick={c.remove}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-xs hover:bg-muted/70"
        >
          {c.label}
          <span aria-hidden className="text-muted-foreground">✕</span>
        </button>
      ))}
      <button onClick={clearAll} className="text-xs text-primary hover:underline">
        Xóa tất cả
      </button>
    </div>
  );
}
