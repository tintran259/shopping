"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
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
  const current = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0];

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (v: string) => {
    setValue("sort", v === "relevance" ? null : v);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background pl-3 pr-2.5 text-sm transition hover:border-foreground/40"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground" aria-hidden>
          <path d="M3 6h12M3 12h9M3 18h6M17 8V4m0 0-3 3m3-3 3 3" />
        </svg>
        <span className="text-muted-foreground">Sắp xếp:</span>
        <span className="font-medium">{current.label}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("text-muted-foreground transition", open && "rotate-180")} aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-background p-1.5 shadow-2xl ring-1 ring-black/5"
        >
          {OPTIONS.map((o) => {
            const active = o.value === value;
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => pick(o.value)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition hover:bg-muted",
                    active && "bg-muted/60 font-medium",
                  )}
                >
                  {o.label}
                  {active && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary" aria-hidden>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
