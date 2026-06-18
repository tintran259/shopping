"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { colorHex } from "../../utils/swatch";
import type { Facet } from "@/types/product";
import { useProductFilters } from "../../hooks/use-product-filters";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border/60 pb-5 last:border-b-0">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

/** Checkbox list — brand, size, region, cert, material, origin… */
function CheckboxFacet({ facet }: { facet: Facet }) {
  const { getList, toggleInList } = useProductFilters();
  const selected = getList(facet.key);

  return (
    <Section title={facet.label}>
      <ul className="space-y-2">
        {facet.options?.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <li key={opt.value}>
              <label className="group flex cursor-pointer items-center gap-2.5 text-sm">
                <span
                  className={cn(
                    "flex size-4 items-center justify-center rounded-[5px] border transition border-(--theme-checkbox-border,var(--border))",
                    checked
                      ? "bg-(--theme-checkbox-background,var(--primary)) text-(--theme-checkbox-icon,var(--primary-foreground))"
                      : "group-hover:border-foreground/40",
                  )}
                >
                  {checked && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <input type="checkbox" checked={checked} onChange={() => toggleInList(facet.key, opt.value)} className="sr-only" />
                <span className={cn("flex-1", checked && "font-medium")}>{opt.label}</span>
                <span className="text-xs text-muted-foreground">{opt.count}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

/** Color dots — swatch facet. */
function SwatchFacet({ facet }: { facet: Facet }) {
  const { getList, toggleInList } = useProductFilters();
  const selected = getList(facet.key);

  return (
    <Section title={facet.label}>
      <div className="flex flex-wrap gap-2.5">
        {facet.options?.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              title={`${opt.label} (${opt.count})`}
              onClick={() => toggleInList(facet.key, opt.value)}
              aria-pressed={checked}
              className={cn(
                "size-7 rounded-full ring-1 ring-border ring-offset-2 ring-offset-background transition",
                checked ? "ring-2 ring-primary" : "hover:ring-foreground/40",
              )}
              style={{ backgroundColor: colorHex(opt.value) }}
            />
          );
        })}
      </div>
    </Section>
  );
}

function PriceFilter() {
  const { get, setMany } = useProductFilters();
  const [min, setMin] = useState(get("min"));
  const [max, setMax] = useState(get("max"));

  return (
    <Section title="Khoảng giá">
      <div className="flex items-center gap-2">
        <input
          inputMode="numeric"
          placeholder="Từ"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm focus:border-primary focus:outline-none"
        />
        <span className="text-muted-foreground">–</span>
        <input
          inputMode="numeric"
          placeholder="Đến"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm focus:border-primary focus:outline-none"
        />
      </div>
      <Button
        variant="secondary"
        className="mt-2.5 h-10 w-full rounded-lg"
        onClick={() => setMany({ min: min.trim() || null, max: max.trim() || null })}
      >
        Áp dụng
      </Button>
    </Section>
  );
}

/** Renders each facet by its declared `type` — no vertical-specific code. */
export function FilterControls({ facets, className }: { facets: Facet[]; className?: string }) {
  return (
    <div className={cn("space-y-5", className)}>
      {facets.map((f) =>
        f.type === "swatch" ? <SwatchFacet key={f.key} facet={f} /> : <CheckboxFacet key={f.key} facet={f} />,
      )}
      <PriceFilter />
    </div>
  );
}
