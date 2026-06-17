"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SearchIcon } from "./icons";

export function SearchBar({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const term = q.trim();
        if (term) router.push(`/search?q=${encodeURIComponent(term)}`);
      }}
      className={`relative flex items-center ${className}`}
    >
      <SearchIcon className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Tìm sản phẩm…"
        aria-label="Tìm sản phẩm"
        className="h-9 w-full rounded-full border border-border bg-(--theme-search-bar-background,var(--muted)) pl-9 pr-3 text-sm outline-none transition focus:border-ring focus:bg-background"
      />
    </form>
  );
}
