"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";

/**
 * Read + mutate PLP filter state through the URL. Every change resets `page`
 * (you're looking at a new result set) and pushes a soft navigation, which
 * re-runs the server page (re-fetch) and shows the route skeleton.
 *
 * `isPending` reflects the in-flight navigation so controls can show a busy
 * state without blocking interaction.
 */
export function useProductFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const params = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);

  const commit = useCallback(
    (next: URLSearchParams) => {
      const qs = next.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
      // Bring the user back to the top of the list smoothly after a change —
      // `scroll: false` above keeps the position, this animates it instead.
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [pathname, router],
  );

  /** Read a comma-separated multi-value param as an array. */
  const getList = useCallback(
    (key: string) => {
      const raw = params.get(key);
      return raw ? raw.split(",").filter(Boolean) : [];
    },
    [params],
  );

  const get = useCallback((key: string) => params.get(key) ?? "", [params]);

  /** Toggle one value within a comma-separated list param. */
  const toggleInList = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      const current = (next.get(key)?.split(",").filter(Boolean)) ?? [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      if (updated.length) next.set(key, updated.join(","));
      else next.delete(key);
      next.delete("page");
      commit(next);
    },
    [params, commit],
  );

  /** Set or clear a single-value param. */
  const setValue = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== "page") next.delete("page");
      commit(next);
    },
    [params, commit],
  );

  /** Set/clear several params at once (used by the price range form). */
  const setMany = useCallback(
    (entries: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(entries)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      next.delete("page");
      commit(next);
    },
    [params, commit],
  );

  const clearAll = useCallback(() => commit(new URLSearchParams()), [commit]);

  return { params, isPending, getList, get, toggleInList, setValue, setMany, clearAll };
}
