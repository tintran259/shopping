"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/pricing";
import { useDebouncedValue } from "@/features/search/hooks/use-debounced-value";
import { useSearchSuggestions } from "@/features/search/hooks/use-search-suggestions";
import { SearchIcon } from "./icons";

export function SearchBar({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const debounced = useDebouncedValue(q, 250);
  const { data, isFetching } = useSearchSuggestions(debounced);

  const term = q.trim();
  const showPanel = open && term.length >= 2;

  // Close on outside click.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const goSearch = (value: string) => {
    const t = value.trim();
    if (!t) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(t)}`);
  };

  const products = data?.products ?? [];
  const categories = data?.categories ?? [];
  const empty = !isFetching && !!data && data.total === 0 && categories.length === 0;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          goSearch(q);
        }}
        className="relative flex items-center"
      >
        <SearchIcon className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          placeholder="Tìm sản phẩm…"
          aria-label="Tìm sản phẩm"
          role="combobox"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-expanded={showPanel}
          className="h-9 w-full rounded-full border border-border bg-(--theme-search-bar-background,var(--muted)) pl-9 pr-3 text-sm outline-none transition focus:border-ring focus:bg-background"
        />
      </form>

      {showPanel && (
        <div id="search-suggestions" className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-2xl border border-border bg-background shadow-2xl ring-1 ring-black/5">
          {/* Categories */}
          {categories.length > 0 && (
            <ul className="border-b border-border/60 p-1.5">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/c/${c.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm hover:bg-muted"
                  >
                    <SearchIcon className="size-4 text-muted-foreground" />
                    <span>
                      Danh mục: <span className="font-medium">{c.name}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* Products */}
          {products.length > 0 && (
            <ul className="max-h-80 overflow-auto p-1.5">
              {products.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/product/${p.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted"
                  >
                    <div className="relative size-11 shrink-0 overflow-hidden rounded-md bg-muted/70">
                      {p.thumbnail?.url && (
                        <Image src={p.thumbnail.url} alt="" fill sizes="44px" className="object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.priceVaries && "Từ "}
                        {formatPrice(p.price.amount, p.price.currency)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* States */}
          {isFetching && products.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Đang tìm…</p>
          )}
          {empty && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Không tìm thấy sản phẩm cho “{term}”.
            </p>
          )}

          {/* See-all */}
          {!!data && data.total > 0 && (
            <button
              type="button"
              onClick={() => goSearch(q)}
              className="flex w-full items-center justify-between border-t border-border/60 px-4 py-2.5 text-sm font-medium text-primary hover:bg-muted"
            >
              <span>Xem tất cả {data.total} kết quả</span>
              <span aria-hidden>→</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
