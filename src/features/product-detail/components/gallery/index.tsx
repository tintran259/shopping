"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types/product";

function Placeholder() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-muted-foreground/60">
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
      <span className="text-xs">Chưa có ảnh</span>
    </div>
  );
}

const arrowCls =
  "absolute top-1/2 z-10 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-md backdrop-blur transition hover:bg-background opacity-0 group-hover:opacity-100";

export function Gallery({ images, name }: { images: ProductImage[]; name: string }) {
  const valid = images.filter((img) => img.url);
  const total = valid.length;
  const [active, setActive] = useState(0);
  const thumbsRef = useRef<HTMLDivElement>(null);

  // Keep the active thumbnail visible — matters when there are many images.
  useEffect(() => {
    const el = thumbsRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [active]);

  const go = (delta: number) => total && setActive((a) => (a + delta + total) % total);

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="group relative aspect-square overflow-hidden rounded-2xl bg-muted/60 ring-1 ring-border/50">
        {valid[active] ? (
          <Image
            src={valid[active].url}
            alt={valid[active].alt || name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <Placeholder />
        )}

        {total > 1 && (
          <>
            <button type="button" aria-label="Ảnh trước" onClick={() => go(-1)} className={cn(arrowCls, "left-2")}>
              ‹
            </button>
            <button type="button" aria-label="Ảnh sau" onClick={() => go(1)} className={cn(arrowCls, "right-2")}>
              ›
            </button>
            <span className="absolute bottom-2 right-2 rounded-full bg-foreground/70 px-2 py-0.5 text-xs font-medium text-background">
              {active + 1}/{total}
            </span>
          </>
        )}
      </div>

      {/* Thumbnails — horizontal scroll handles 20+ images */}
      {total > 1 && (
        <div ref={thumbsRef} className="flex gap-2 overflow-x-auto pb-1">
          {valid.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              data-idx={i}
              onClick={() => setActive(i)}
              aria-label={`Ảnh ${i + 1}`}
              aria-current={i === active}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted/60 ring-1 transition",
                i === active ? "ring-2 ring-primary" : "ring-border/50 hover:ring-foreground/30",
              )}
            >
              <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
