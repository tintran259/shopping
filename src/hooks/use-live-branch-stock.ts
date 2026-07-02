"use client";

import { useMemo } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { getProductBySlug } from "@/services/product.service";
import type { BranchStock } from "@/types/product";

const STALE_MS = 30_000;

/**
 * Live per-branch stock for a set of product slugs. Cart lines / wishlist items
 * carry a stale branchStock snapshot — this re-verifies against the BE so the
 * UI never lets the shopper exceed what's actually available.
 *
 * Each product is fetched through the canonical `["product", slug]` cache entry
 * (`fetchQuery`), so the data is shared with the PDP and the variant pickers:
 * a product viewed <30s ago is reused instead of refetched, and the fresh copy
 * fetched here warms those screens in turn.
 *
 * Returns a variantId → fresh BranchStock[] map; a missing entry means "no live
 * data (yet)" and callers fall back to their snapshot. `ready` flips true once
 * verification settled (or there was nothing to verify).
 */
export function useLiveBranchStock(slugs: string[]): {
  byVariant: Map<string, BranchStock[]>;
  ready: boolean;
} {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["live-stock", slugs.join(",")],
    queryFn: () =>
      Promise.all(
        slugs.map((slug) =>
          // getProductBySlug never throws (returns null on failure), so the
          // batch always settles.
          qc.fetchQuery({
            queryKey: ["product", slug],
            queryFn: () => getProductBySlug(slug),
            staleTime: STALE_MS,
          }),
        ),
      ),
    enabled: slugs.length > 0,
    staleTime: STALE_MS,
    // Keep the last verified stock while re-verifying after the slug set
    // changes — avoids flashing skeletons/snapshot values on every mutation.
    placeholderData: keepPreviousData,
  });

  const byVariant = useMemo(() => {
    const m = new Map<string, BranchStock[]>();
    for (const p of query.data ?? []) {
      if (!p) continue;
      for (const v of p.variants) if (v.branchStock) m.set(v.id, v.branchStock);
    }
    return m;
  }, [query.data]);

  const ready = slugs.length === 0 || query.isSuccess || query.isError;

  return { byVariant, ready };
}
