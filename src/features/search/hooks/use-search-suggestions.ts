"use client";

import { useQuery } from "@tanstack/react-query";
import type { SearchSuggestions } from "@/services/product.service";

const EMPTY: SearchSuggestions = { products: [], categories: [], total: 0 };

/**
 * Typeahead suggestions via the `/api/search` endpoint (catalog stays server-side).
 * Disabled below 2 chars; results cached briefly so re-typing is instant.
 */
export function useSearchSuggestions(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ["search-suggestions", q],
    enabled: q.length >= 2,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
    queryFn: async (): Promise<SearchSuggestions> => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) return EMPTY;
      return (await res.json()) as SearchSuggestions;
    },
  });
}
