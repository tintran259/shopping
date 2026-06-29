"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useWishlist } from "@/hooks/use-wishlist";
import type { WishlistList } from "@/store/wishlist.store";

const GRID = "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4";

/** 2×2 thumbnail collage previewing a list's items. */
function ListCover({ list }: { list: WishlistList }) {
  return (
    <div className="grid aspect-square grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-xl bg-muted/50">
      {Array.from({ length: 4 }).map((_, i) => {
        const it = list.items[i];
        return (
          <div key={i} className="relative bg-muted/60">
            {it?.thumbnail?.url && (
              <Image src={it.thumbnail.url} alt="" fill sizes="120px" className="object-cover" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function WishlistPage() {
  const { lists, ready, createList, removeList } = useWishlist();

  const [name, setName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<WishlistList | null>(null);

  const onCreate = () => {
    const n = name.trim();
    if (!n) return;
    createList(n);
    setName("");
  };

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:py-10">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Tài khoản
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-(--theme-heading-color,inherit) sm:text-4xl">
          Danh sách yêu thích
        </h1>
        <div className="mt-4 flex max-w-md items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onCreate()}
            placeholder="Tên danh sách mới…"
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
          />
          <Button size="sm" className="shrink-0" onClick={onCreate} disabled={!name.trim()}>
            Tạo danh sách
          </Button>
        </div>
      </header>

      {!ready ? (
        <div className={GRID}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : lists.length === 0 ? (
        <div className="flex min-h-[35vh] flex-col items-center justify-center gap-2 text-center">
          <p className="text-base font-medium">Chưa có danh sách nào</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Tạo một danh sách ở trên, rồi nhấn trái tim trên sản phẩm để lưu vào đó.
          </p>
        </div>
      ) : (
        <div className={GRID}>
          {lists.map((l) => (
            <div key={l.id} className="group relative">
              <Link
                href={`/wishlist/${l.id}`}
                className="block rounded-2xl border border-border p-3 transition hover:shadow-sm"
              >
                <ListCover list={l} />
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{l.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {l.items.length} SP
                  </span>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setPendingDelete(l)}
                aria-label={`Xóa danh sách ${l.name}`}
                className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-full bg-background/85 text-muted-foreground opacity-0 shadow-sm backdrop-blur transition hover:text-destructive group-hover:opacity-100"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Xóa danh sách"
        description={
          pendingDelete
            ? `Bạn có thật sự muốn xóa danh sách "${pendingDelete.name}" không?`
            : undefined
        }
        confirmLabel="Xóa"
        danger
        onConfirm={() => {
          if (pendingDelete) removeList(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </main>
  );
}
